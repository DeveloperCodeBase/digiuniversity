"""Pydantic schemas for the AI Gateway API surface.

The shapes here are the contract that a future GPU-backed implementation
must conform to. See docs/architecture/AI_GATEWAY.md for the prose.
"""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    version: str
    mode: str
    timestamp: datetime


class AiResponseEnvelope(BaseModel):
    """Every AI output carries provenance + a humanReviewRequired flag.

    Mandated by AGENTS.md and docs/product/PRODUCT_BRIEF.md — automated
    systems must NEVER make final grading or disciplinary decisions, so
    confidence + humanReviewRequired travel with every payload.
    """

    request_id: str
    model: str
    provider: str
    mode: str
    confidence: float = Field(ge=0.0, le=1.0)
    human_review_required: bool
    payload: Any


class RagQueryIn(BaseModel):
    tenant_id: str
    course_id: str | None = None
    user_id: str | None = None
    query: str
    top_k: int = Field(default=5, ge=1, le=20)


class ClassSummarizeIn(BaseModel):
    tenant_id: str
    course_id: str
    class_session_id: str
    language: str = "fa"
    media_url: str | None = None
    transcript_url: str | None = None


class QuizGenerateIn(ClassSummarizeIn):
    count: int = Field(default=5, ge=1, le=20)


class ExtractConceptsIn(ClassSummarizeIn):
    pass


class LearnerProfileUpdateIn(BaseModel):
    tenant_id: str
    user_id: str
    events: list[dict[str, Any]]


class LearningRiskPredictIn(BaseModel):
    tenant_id: str
    user_id: str
    course_id: str
    features: dict[str, Any]


class EmbeddingsBatchIn(BaseModel):
    tenant_id: str
    items: list[str]


class AsrJobIn(BaseModel):
    tenant_id: str
    media_url: str
    language: str = "fa"
