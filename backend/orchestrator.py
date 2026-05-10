import asyncio
import json
from typing import Any

from agents import tool_agente_inquisitore, tool_agente_mentore
from make_questions_mcp import (
    ClaimReview,
    _fallback_review,
    check_claim as check_claim_tool,
    generate_question as generate_question_tool,
)


def genera_domanda_checkpoint(topic: str, context: str) -> str:
    """Generate one checkpoint question through the question MCP tool."""
    try:
        question = generate_question_tool.invoke({
            "topic": topic,
            "context": context,
        })
        return str(question).strip()
    except Exception as exc:
        print(f"[genera_domanda_checkpoint fallback] {type(exc).__name__}: {exc}")
        return f"Explain the key distinction in {topic} in your own words."


def _coerce_claim_review(raw: Any, question: str, answer: str, context: str) -> ClaimReview:
    try:
        if isinstance(raw, ClaimReview):
            return raw
        if isinstance(raw, str):
            return ClaimReview.model_validate_json(raw)
        if isinstance(raw, dict):
            return ClaimReview.model_validate(raw)
        return ClaimReview.model_validate(json.loads(str(raw)))
    except Exception as exc:
        print(f"[claim_review coercion fallback] {type(exc).__name__}: {exc}")
        return _fallback_review(question, answer, context)


def controlla_claim_checkpoint(
    question: str,
    answer: str,
    context: str,
    demo_mode: bool = False,
    answer_context: str | None = None,
) -> dict:
    """Measure an answer through the claim-review MCP tool and return valid JSON data."""
    try:
        raw_review = check_claim_tool.invoke({
            "question": question,
            "answer": answer,
            "context": context,
            "answer_context": answer_context,
        })
        review = _coerce_claim_review(raw_review, question, answer, context)
    except Exception as exc:
        print(f"[controlla_claim_checkpoint fallback] {type(exc).__name__}: {exc}")
        review = _fallback_review(question, answer, context)

    return review.model_dump()


def genera_domande_pianificazione():
    """
    Called by React while the user configures the session.
    Keeps the user engaged and builds the persona profile.
    """
    return {
        "fase": "Planning",
        "titolo_ui": "Set up your study session",
        "domande": [
            {
                "id": "q1_obiettivo",
                "testo": "What is your goal with this document?",
                "opzioni": ["Review for an exam", "First exploratory read", "Look up specific concepts"],
            },
            {
                "id": "q2_tempo",
                "testo": "How much time do you have today?",
                "opzioni": ["Short - I am in a hurry", "Enough - 30 to 60 minutes", "Plenty - I want to go deep"],
            },
            {
                "id": "q3_conoscenza_pregressa",
                "testo": "How much background do you already have?",
                "opzioni": ["Starting from scratch", "I have some background", "I'm confident - challenge me"],
            },
        ],
    }


def applica_matrice_cognitiva(tutte_le_mutazioni, profilo):
    """
    Decide which mutations to keep based on persona and knowledge graph.
    Returns up to 4 balanced mutations.
    """
    if not tutte_le_mutazioni:
        return []

    persona = profilo.get("persona_comportamentale", {})
    grafo = profilo.get("grafo_conoscenza", {})
    lacune = set(grafo.get("lacune", []))
    frizione = persona.get("frizione_preferita", "bilanciata")
    velocita = persona.get("velocita", "media")
    dipendenza = persona.get("dipendenza_aiuti", "alta")

    lacune_mut = [m for m in tutte_le_mutazioni if m.get("target") in lacune]

    if velocita == "alta":
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("cloze", "domanda_inline")]
        support_mut = []
    elif frizione == "alta":
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("domanda_inline", "confronto")]
        support_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") == "insight"]
    else:
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("cloze", "domanda_inline")]
        support_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("insight", "confronto")]

    support_limit = 2 if dipendenza == "alta" else 1

    seen = set()
    selected = []
    for mutation in lacune_mut + frizione_mut + support_mut[:support_limit]:
        if id(mutation) not in seen:
            seen.add(id(mutation))
            selected.append(mutation)

    if len(selected) < 2:
        for mutation in tutte_le_mutazioni:
            if id(mutation) not in seen:
                seen.add(id(mutation))
                selected.append(mutation)
            if len(selected) >= 2:
                break

    return selected[:4]


async def genera_documento_vivente(sezione_id: str, testo_chunk: str, profilo: dict):
    """
    Run both mutation agents in parallel and apply the cognitive matrix.
    """
    lacune = profilo.get("grafo_conoscenza", {}).get("lacune", [])
    cognitive_trace = profilo.get("braynr_cognitive_trace", "")

    risultati = await asyncio.gather(
        tool_agente_inquisitore(testo_chunk, lacune, cognitive_trace),
        tool_agente_mentore(testo_chunk, cognitive_trace),
    )

    tutte_mutazioni = [item for sublist in risultati for item in sublist]
    return applica_matrice_cognitiva(tutte_mutazioni, profilo)
