"""HTTP routes for the AI Gateway.

Every endpoint wraps its payload in AiResponseEnvelope (model + confidence
+ humanReviewRequired). When AI_MODE=external_api we forward to the
upstream provider; otherwise we use the mock_provider.
"""

from datetime import datetime, timezone
from uuid import uuid4

import httpx
from fastapi import APIRouter, HTTPException

from . import mock_provider
from .schemas import (
    AiResponseEnvelope,
    AsrJobIn,
    ClassSummarizeIn,
    EmbeddingsBatchIn,
    ExtractConceptsIn,
    HealthResponse,
    LearnerProfileUpdateIn,
    LearningRiskPredictIn,
    QuizGenerateIn,
    RagQueryIn,
)
from .settings import settings


router = APIRouter(prefix="/v1")


def _envelope(payload: object, confidence: float = 0.82) -> AiResponseEnvelope:
    return AiResponseEnvelope(
        request_id=f"req_{uuid4().hex[:16]}",
        model=mock_provider.MOCK_MODEL,
        provider=mock_provider.MOCK_PROVIDER,
        mode=settings.ai_mode,
        confidence=confidence,
        human_review_required=confidence < 0.85,
        payload=payload,
    )


async def _proxy(path: str, body: object) -> object:
    """Forward to the configured external provider. Phase 1 placeholder."""
    if settings.ai_mode != "external_api":
        raise RuntimeError("called _proxy outside external_api mode")
    url = f"{settings.ai_services_base_url.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"Authorization": f"Bearer {settings.ai_services_api_key}"},
        )
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"upstream {resp.status_code}")
    return resp.json()


# ---------- health ----------

@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
        mode=settings.ai_mode,
        timestamp=datetime.now(timezone.utc),
    )


# ---------- RAG ----------

@router.post("/rag/query", response_model=AiResponseEnvelope)
async def rag_query(body: RagQueryIn) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        data = await _proxy("/v1/rag/query", body.model_dump())
    else:
        data = mock_provider.rag_query(body.query, body.top_k)
    return _envelope(data, confidence=0.74)


# ---------- class session AI ----------

@router.post("/class-sessions/{session_id}/summarize", response_model=AiResponseEnvelope)
async def summarize(session_id: str, body: ClassSummarizeIn) -> AiResponseEnvelope:
    body.class_session_id = session_id
    if settings.ai_mode == "external_api":
        data = await _proxy(f"/v1/class-sessions/{session_id}/summarize", body.model_dump())
    else:
        data = mock_provider.class_summarize(session_id)
    return _envelope(data, confidence=0.81)


@router.post("/class-sessions/{session_id}/extract-concepts", response_model=AiResponseEnvelope)
async def extract_concepts(session_id: str, body: ExtractConceptsIn) -> AiResponseEnvelope:
    body.class_session_id = session_id
    if settings.ai_mode == "external_api":
        data = await _proxy(f"/v1/class-sessions/{session_id}/extract-concepts", body.model_dump())
    else:
        data = mock_provider.extract_concepts(session_id)
    return _envelope(data, confidence=0.79)


@router.post("/class-sessions/{session_id}/generate-quiz", response_model=AiResponseEnvelope)
async def generate_quiz(session_id: str, body: QuizGenerateIn) -> AiResponseEnvelope:
    body.class_session_id = session_id
    if settings.ai_mode == "external_api":
        data = await _proxy(f"/v1/class-sessions/{session_id}/generate-quiz", body.model_dump())
    else:
        data = mock_provider.quiz_generate(session_id, body.count)
    return _envelope(data, confidence=0.76)


@router.post("/class-sessions/{session_id}/analyze", response_model=AiResponseEnvelope)
async def analyze(session_id: str, body: ClassSummarizeIn) -> AiResponseEnvelope:
    body.class_session_id = session_id
    if settings.ai_mode == "external_api":
        data = await _proxy(f"/v1/class-sessions/{session_id}/analyze", body.model_dump())
    else:
        data = mock_provider.class_analyze(session_id)
    return _envelope(data, confidence=0.78)


# ---------- learner profile + risk ----------

@router.post("/learner-profile/update", response_model=AiResponseEnvelope)
async def learner_profile_update(body: LearnerProfileUpdateIn) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        data = await _proxy("/v1/learner-profile/update", body.model_dump())
    else:
        data = mock_provider.learner_profile_update(body.user_id, body.events)
    return _envelope(data, confidence=0.88)


@router.post("/learning-risk/predict", response_model=AiResponseEnvelope)
async def learning_risk_predict(body: LearningRiskPredictIn) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        data = await _proxy("/v1/learning-risk/predict", body.model_dump())
    else:
        data = mock_provider.learning_risk_predict(body.user_id, body.course_id)
    # Risk predictions ALWAYS require human review per AGENTS.md.
    return _envelope(data, confidence=0.60)


# ---------- embeddings ----------

@router.post("/embeddings/batch", response_model=AiResponseEnvelope)
async def embeddings_batch(body: EmbeddingsBatchIn) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        data = await _proxy("/v1/embeddings/batch", body.model_dump())
    else:
        data = mock_provider.embeddings_batch(body.items)
    return _envelope(data, confidence=0.95)


# ---------- ASR ----------

@router.post("/asr/jobs", response_model=AiResponseEnvelope)
async def asr_submit(body: AsrJobIn) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        data = await _proxy("/v1/asr/jobs", body.model_dump())
    else:
        data = mock_provider.asr_submit(body.media_url)
    return _envelope(data, confidence=0.90)


@router.get("/asr/jobs/{job_id}", response_model=AiResponseEnvelope)
async def asr_status(job_id: str) -> AiResponseEnvelope:
    if settings.ai_mode == "external_api":
        url = f"{settings.ai_services_base_url.rstrip('/')}/v1/asr/jobs/{job_id}"
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {settings.ai_services_api_key}"},
            )
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"upstream {resp.status_code}")
        data = resp.json()
    else:
        data = mock_provider.asr_status(job_id)
    return _envelope(data, confidence=0.93)
