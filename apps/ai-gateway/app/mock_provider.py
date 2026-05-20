"""Mock AI provider — returns deterministic, plausible Persian responses.

Used when AI_MODE=mock (the default while no GPU server is wired up).
Every payload is wrapped by routes.py in an AiResponseEnvelope, so the
rest of the platform never has to know whether the response came from a
real model or this stub.
"""

from typing import Any
from uuid import uuid4


MOCK_MODEL = "mock-fa-1"
MOCK_PROVIDER = "internal-mock"


def _id() -> str:
    return f"mock_{uuid4().hex[:12]}"


def rag_query(query: str, top_k: int) -> dict[str, Any]:
    return {
        "answer": f"پاسخ آزمایشی به: «{query}» — این پاسخ توسط ماک تولید شده است.",
        "citations": [
            {"id": _id(), "title": "نمونه مرجع ۱", "score": 0.78},
            {"id": _id(), "title": "نمونه مرجع ۲", "score": 0.64},
        ][:top_k],
    }


def class_summarize(class_session_id: str) -> dict[str, Any]:
    return {
        "class_session_id": class_session_id,
        "summary": (
            "در این جلسه مفاهیم پایه یادگیری ماشین، overfitting و validation "
            "توضیح داده شد. (پاسخ آزمایشی)"
        ),
        "highlights": [
            "تعریف overfitting",
            "اهمیت validation set",
            "روش‌های جلوگیری از overfitting",
        ],
    }


def quiz_generate(class_session_id: str, count: int) -> dict[str, Any]:
    questions = [
        {
            "id": _id(),
            "type": "multiple_choice",
            "question": f"سوال شماره {i + 1}: overfitting چه زمانی رخ می‌دهد؟",
            "options": [
                "زمانی که مدل روی داده‌های آموزشی بیش از حد دقیق می‌شود",
                "زمانی که داده آموزشی کم است",
                "زمانی که داده تست با آموزش یکسان است",
                "هیچکدام",
            ],
            "answer_index": 0,
        }
        for i in range(count)
    ]
    return {"class_session_id": class_session_id, "quiz": questions}


def extract_concepts(class_session_id: str) -> dict[str, Any]:
    return {
        "class_session_id": class_session_id,
        "concepts": [
            {"name": "Overfitting", "level": "intermediate"},
            {"name": "Validation set", "level": "beginner"},
            {"name": "Regularization", "level": "advanced"},
        ],
    }


def class_analyze(class_session_id: str) -> dict[str, Any]:
    return {
        "class_session_id": class_session_id,
        "summary": class_summarize(class_session_id)["summary"],
        "concepts": extract_concepts(class_session_id)["concepts"],
        "quiz": quiz_generate(class_session_id, count=3)["quiz"],
    }


def learner_profile_update(user_id: str, events: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "events_ingested": len(events),
        "profile_delta": {
            "engagement": 0.05,
            "mastery": {"overfitting": 0.10},
        },
    }


def learning_risk_predict(user_id: str, course_id: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "course_id": course_id,
        "risk_score": 0.32,
        "risk_band": "medium",
        "explanations": [
            "تأخیر در تحویل دو تکلیف اخیر",
            "زمان فعالیت در کلاس کاهش یافته است",
        ],
    }


def embeddings_batch(items: list[str]) -> dict[str, Any]:
    # 8-dim toy vector per item — keeps the response small while still typed.
    return {
        "model": MOCK_MODEL,
        "vectors": [[round((len(s) + i) / 10, 4) for i in range(8)] for s in items],
    }


def asr_submit(media_url: str) -> dict[str, Any]:
    return {"job_id": _id(), "status": "queued", "media_url": media_url}


def asr_status(job_id: str) -> dict[str, Any]:
    return {
        "job_id": job_id,
        "status": "completed",
        "transcript": "این یک متن آزمایشی است که توسط ماک تولید شده.",
        "language": "fa",
        "duration_seconds": 42.0,
    }


def assessment_grade_draft(
    submission_id: str,
    questions: list[dict[str, Any]],
    answers: dict[str, Any],
) -> dict[str, Any]:
    """Per-question rubric notes + a suggested overall grade.

    Returns mock scores that look plausible enough for the SPA to render
    a useful UI. The envelope wrapping happens in routes.py.
    """
    total_points = sum(int(q.get("points") or 1) for q in questions) or 1
    earned = 0
    per_question: list[dict[str, Any]] = []
    for q in questions:
        pts = int(q.get("points") or 1)
        # Mock heuristic: short answers + essays get partial credit;
        # multiple-choice gets full credit if an answer was provided.
        suggested = pts if q.get("kind") == "multiple_choice" else round(pts * 0.7, 2)
        earned += suggested
        per_question.append(
            {
                "question_id": q.get("id"),
                "suggested_points": suggested,
                "max_points": pts,
                "rubric_notes": (
                    "نمره پیشنهادی بر اساس مطابقت پاسخ با شاخص‌های هدف."
                ),
            }
        )
    grade_pct = round((earned / total_points) * 100, 2)
    return {
        "submission_id": submission_id,
        "suggested_grade": grade_pct,
        "earned_points": round(earned, 2),
        "total_points": total_points,
        "per_question": per_question,
        "feedback": (
            "تحلیل اولیه نشان می‌دهد دانشجو با مفاهیم کلیدی آشناست؛ "
            "بازبینی نهایی توسط استاد توصیه می‌شود."
        ),
    }
