"""Turn a free-text business case into structured search criteria.

Uses the same OpenAI client pattern as the AI report generator. The model is
asked to return strict JSON describing the Ideal Customer Profile, which we
validate into `SearchCriteria`.
"""
from __future__ import annotations

import json
import os

from .base import SearchCriteria

_SYSTEM = (
    "You are a B2B sales operations expert. Given a business case, infer the "
    "Ideal Customer Profile and translate it into search filters for a B2B "
    "contact database (Apollo-style). Respond with ONLY a JSON object, no prose."
)

_SCHEMA_HINT = """Return JSON with exactly these keys (use [] when unknown):
{
  "job_titles":       ["specific job titles the buyer/champion would hold"],
  "seniorities":      ["one or more of: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry"],
  "industries":       ["target industries"],
  "locations":        ["cities, states or countries — only if the case implies geography"],
  "keywords":         ["signal words describing the buyer's role, responsibilities or interests"],
  "company_headcount":["employee-count bands as 'min,max' strings, e.g. '11,50', '51,200' — only if implied"]
}
Keep each list focused (max ~8 items). Do not invent geography or company size
if the business case does not imply it."""


class ICPUnavailable(RuntimeError):
    """Raised when the LLM needed to derive an ICP is not configured."""


async def derive_criteria(
    business_case: str,
    company_name: str | None = None,
) -> SearchCriteria:
    """Derive `SearchCriteria` from a business case using the LLM.

    Raises `ICPUnavailable` if OpenAI is not configured or the package is
    missing — callers surface this as a 503, mirroring the report generator.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ICPUnavailable(
            "OPENAI_API_KEY is not configured. Set it in the backend "
            "environment to derive search criteria from a business case."
        )

    prompt_parts = [
        "BUSINESS CASE:",
        business_case.strip(),
    ]
    if company_name and company_name.strip():
        prompt_parts += [
            "",
            f"TARGET/EXAMPLE COMPANY: {company_name.strip()}",
            "Use this to infer the industry, company size and the kind of "
            "roles that would be the buyer — but return people-search filters, "
            "not just this one company.",
        ]
    prompt_parts += ["", _SCHEMA_HINT]
    prompt = "\n".join(prompt_parts)

    try:
        import openai

        client = openai.AsyncOpenAI(api_key=api_key, timeout=60.0)
        response = await client.chat.completions.create(
            model="gpt-4o",
            max_tokens=800,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
    except ImportError as exc:  # pragma: no cover - matches reports.py behaviour
        raise ICPUnavailable("openai package is not installed. Run: pip install openai") from exc

    raw = response.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    criteria = SearchCriteria(
        job_titles=_as_list(data.get("job_titles")),
        seniorities=_as_list(data.get("seniorities")),
        industries=_as_list(data.get("industries")),
        locations=_as_list(data.get("locations")),
        keywords=_as_list(data.get("keywords")),
        company_headcount=_as_list(data.get("company_headcount")),
    )
    if company_name and company_name.strip():
        criteria.company_names = [company_name.strip()]
    return criteria


def _as_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []
