"""Provider-agnostic contracts for lead search.

The rest of the app only ever talks to a `LeadProvider`. Swapping Apollo for
ZoomInfo, Clay, People Data Labs, etc. means writing one new adapter that maps
that vendor's response onto `Lead` — nothing else changes.

All providers here are *compliant B2B data APIs*: they return business contact
data that the vendor is licensed to supply. We deliberately do not scrape
LinkedIn or harvest personal contact details from the open web.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel, Field


class SearchCriteria(BaseModel):
    """Structured filters used to query a data provider.

    Produced from a free-text business case by `icp.derive_criteria`, but can
    also be supplied/edited directly by the user.
    """

    job_titles: list[str] = Field(default_factory=list)
    seniorities: list[str] = Field(
        default_factory=list,
        description="e.g. owner, founder, c_suite, vp, director, manager, head",
    )
    industries: list[str] = Field(default_factory=list)
    locations: list[str] = Field(
        default_factory=list, description="Cities, states or countries"
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Free-text signals to match in a person's profile/role",
    )
    company_names: list[str] = Field(default_factory=list)
    company_domains: list[str] = Field(default_factory=list)
    company_headcount: list[str] = Field(
        default_factory=list,
        description="Employee-count bands, e.g. '11,50', '51,200'",
    )


class Lead(BaseModel):
    """A single person returned by a provider, normalised across vendors."""

    full_name: str = ""
    first_name: str = ""
    last_name: str = ""
    title: str = ""
    seniority: str = ""
    company: str = ""
    company_domain: str = ""
    industry: str = ""
    location: str = ""
    email: str = ""
    # True when the provider returned a real, deliverable address; False when it
    # is masked/locked behind a higher plan tier (e.g. Apollo free tier).
    email_verified: bool = False
    phone: str = ""
    linkedin_url: str = ""
    source: str = ""
    match_reason: str = ""


class LeadProvider(ABC):
    """Interface every data-source adapter implements."""

    #: Short identifier used in `Lead.source` and error messages.
    name: str = "base"

    @abstractmethod
    async def search(self, criteria: SearchCriteria, *, limit: int) -> list[Lead]:
        """Return up to `limit` leads matching `criteria`."""
        raise NotImplementedError


class ProviderNotConfigured(RuntimeError):
    """Raised when the selected provider is missing required credentials."""
