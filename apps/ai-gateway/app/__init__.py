"""DigiUniversity AI Gateway.

A thin adapter between the core API and external AI providers. The current
VPS has no GPU; all heavy AI is delegated to an external provider via
AI_SERVICES_BASE_URL when AI_MODE=external_api, otherwise mock responses
are returned so the rest of the platform can run locally.
"""

__version__ = "0.1.0"
