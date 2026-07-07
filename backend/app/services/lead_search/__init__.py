"""Lead search service — provider-agnostic B2B lead discovery.

Compliant by design: leads come from licensed B2B data APIs (Apollo today,
ZoomInfo/Clay/etc. via new adapters tomorrow). We do not scrape LinkedIn or
harvest personal contact details from the open web.
"""
from __future__ import annotations

from app.core.config import settings

from .apollo import ApolloProvider
from .base import Lead, LeadProvider, ProviderNotConfigured, SearchCriteria
from .icp import ICPUnavailable, derive_criteria

__all__ = [
    "Lead",
    "LeadProvider",
    "ProviderNotConfigured",
    "SearchCriteria",
    "ICPUnavailable",
    "derive_criteria",
    "get_provider",
]

_REGISTRY = {"apollo": ApolloProvider}


def get_provider(name: str | None = None) -> LeadProvider:
    """Instantiate the configured provider.

    Raises `ProviderNotConfigured` for an unknown provider name or missing
    credentials — callers surface this as a 503.
    """
    provider_name = (name or settings.LEAD_PROVIDER or "apollo").lower()
    factory = _REGISTRY.get(provider_name)
    if factory is None:
        raise ProviderNotConfigured(
            f"Unknown lead provider '{provider_name}'. "
            f"Supported: {', '.join(sorted(_REGISTRY))}."
        )
    if provider_name == "apollo":
        return ApolloProvider(settings.APOLLO_API_KEY)
    return factory()  # pragma: no cover - future providers
