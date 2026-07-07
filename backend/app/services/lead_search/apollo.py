"""Apollo.io adapter.

Apollo is a compliant B2B data provider with a documented REST API. We use two
endpoints:

  * POST /api/v1/mixed_people/search   — find people matching the criteria
  * POST /api/v1/people/match          — enrich a person to reveal verified
                                         business email / phone

On the search endpoint Apollo returns *masked* emails (e.g.
``email_not_unlocked@domain.com``) unless the account has enrichment credits.
When ``reveal_contacts`` is on we attempt an enrichment pass; addresses that
cannot be revealed are returned with ``email_verified=False`` so the UI can be
honest about which contacts are confirmed.

Docs: https://docs.apollo.io/reference/people-search
"""
from __future__ import annotations

import asyncio

import httpx

from .base import Lead, LeadProvider, ProviderNotConfigured, SearchCriteria

_BASE_URL = "https://api.apollo.io/api/v1"
# Apollo caps search at 100 per page; keep concurrency modest so enrichment
# does not hammer the API (or burn credits) faster than necessary.
_MAX_PER_PAGE = 100
_ENRICH_CONCURRENCY = 5


def _is_masked_email(email: str | None) -> bool:
    if not email:
        return True
    return "email_not_unlocked" in email or "domain.com" in email


def _location(person: dict) -> str:
    parts = [person.get("city"), person.get("state"), person.get("country")]
    return ", ".join(p for p in parts if p)


class ApolloProvider(LeadProvider):
    name = "apollo"

    def __init__(self, api_key: str, *, reveal_contacts: bool = True) -> None:
        if not api_key:
            raise ProviderNotConfigured(
                "APOLLO_API_KEY is not configured. Set it in the backend "
                "environment to enable lead search."
            )
        self._api_key = api_key
        self._reveal_contacts = reveal_contacts
        self._headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "x-api-key": api_key,
        }

    async def search(self, criteria: SearchCriteria, *, limit: int) -> list[Lead]:
        per_page = min(max(limit, 1), _MAX_PER_PAGE)
        payload: dict = {"page": 1, "per_page": per_page}

        if criteria.job_titles:
            payload["person_titles"] = criteria.job_titles
        if criteria.seniorities:
            payload["person_seniorities"] = criteria.seniorities
        if criteria.locations:
            payload["person_locations"] = criteria.locations
        if criteria.industries:
            # Apollo matches industries via keyword search reliably.
            payload["q_keywords"] = " ".join(
                criteria.keywords + criteria.industries
            ).strip()
        elif criteria.keywords:
            payload["q_keywords"] = " ".join(criteria.keywords).strip()
        if criteria.company_domains:
            payload["q_organization_domains"] = "\n".join(criteria.company_domains)
        if criteria.company_names:
            payload["organization_names"] = criteria.company_names
        if criteria.company_headcount:
            payload["organization_num_employees_ranges"] = criteria.company_headcount

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_BASE_URL}/mixed_people/search",
                headers=self._headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

            people = data.get("people") or []
            leads = [self._to_lead(p) for p in people[:limit]]

            if self._reveal_contacts:
                await self._enrich(client, leads)

        return leads

    def _to_lead(self, p: dict) -> Lead:
        org = p.get("organization") or {}
        email = p.get("email") or ""
        phones = p.get("phone_numbers") or []
        phone = ""
        if phones:
            phone = phones[0].get("sanitized_number") or phones[0].get("raw_number") or ""
        return Lead(
            full_name=p.get("name") or "",
            first_name=p.get("first_name") or "",
            last_name=p.get("last_name") or "",
            title=p.get("title") or "",
            seniority=p.get("seniority") or "",
            company=org.get("name") or "",
            company_domain=org.get("primary_domain") or "",
            industry=org.get("industry") or p.get("industry") or "",
            location=_location(p),
            email="" if _is_masked_email(email) else email,
            email_verified=not _is_masked_email(email),
            phone=phone,
            linkedin_url=p.get("linkedin_url") or "",
            source=self.name,
        )

    async def _enrich(self, client: httpx.AsyncClient, leads: list[Lead]) -> None:
        """Reveal verified email/phone for leads whose email came back masked."""
        targets = [
            (i, lead)
            for i, lead in enumerate(leads)
            if not lead.email_verified and (lead.first_name or lead.full_name)
        ]
        if not targets:
            return

        sem = asyncio.Semaphore(_ENRICH_CONCURRENCY)

        async def _one(idx: int, lead: Lead) -> None:
            async with sem:
                params: dict = {
                    "reveal_personal_emails": False,
                    "first_name": lead.first_name,
                    "last_name": lead.last_name,
                }
                if lead.company_domain:
                    params["domain"] = lead.company_domain
                elif lead.company:
                    params["organization_name"] = lead.company
                if lead.linkedin_url:
                    params["linkedin_url"] = lead.linkedin_url
                try:
                    r = await client.post(
                        f"{_BASE_URL}/people/match",
                        headers=self._headers,
                        json=params,
                    )
                    r.raise_for_status()
                    person = (r.json() or {}).get("person") or {}
                except (httpx.HTTPError, ValueError):
                    return  # enrichment is best-effort; leave the lead as-is

                email = person.get("email") or ""
                if not _is_masked_email(email):
                    leads[idx].email = email
                    leads[idx].email_verified = True
                phones = person.get("phone_numbers") or []
                if phones and not leads[idx].phone:
                    leads[idx].phone = (
                        phones[0].get("sanitized_number")
                        or phones[0].get("raw_number")
                        or ""
                    )

        await asyncio.gather(*(_one(i, lead) for i, lead in targets))
