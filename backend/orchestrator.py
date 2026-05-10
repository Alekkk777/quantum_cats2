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
    Questa funzione viene chiamata da React appena l'utente carica il PDF.
    Serve a tenere l'utente occupato mentre il backend fa il Chunking,
    e contemporaneamente ci fornisce i dati per creare la "Persona".
    """
    return {
        "fase": "Pianificazione",
        "titolo_ui": "Impostiamo il tuo Study Engine...",
        "domande": [
            {
                "id": "q1_obiettivo",
                "testo": "Qual è il tuo obiettivo con questo documento?",
                "opzioni": ["Ripasso per un esame", "Prima lettura esplorativa", "Ricerca concetti specifici"]
            },
            {
                "id": "q2_tempo",
                "testo": "Quanto tempo hai a disposizione oggi?",
                "opzioni": ["Poco (Vado di fretta)", "Il giusto (30-60 min)", "Molto (Voglio approfondire)"]
            },
            {
                "id": "q3_conoscenza_pregressa",
                "testo": "Come valuti la tua preparazione attuale su questi argomenti?",
                "opzioni": ["Parto da zero", "Ho delle basi", "Sono un esperto, mettimi alla prova"]
            }
        ]
    }


def applica_matrice_cognitiva(tutte_le_mutazioni, profilo):
    """
    Decide quali mutazioni tenere in base al comportamento (Persona)
    e alle conoscenze (Grafo). Restituisce fino a 4 mutazioni bilanciate.
    """
    if not tutte_le_mutazioni:
        return []

    persona = profilo.get("persona_comportamentale", {})
    grafo = profilo.get("grafo_conoscenza", {})
    lacune = set(grafo.get("lacune", []))
    frizione = persona.get("frizione_preferita", "bilanciata")
    velocita = persona.get("velocita", "media")
    dipendenza = persona.get("dipendenza_aiuti", "alta")

    # Priorità: lacune note → sempre incluse
    lacune_mut = [m for m in tutte_le_mutazioni if m.get("target") in lacune]

    if velocita == "alta":
        # In fretta: solo challenge rapidi
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("cloze", "domanda_inline")]
        support_mut = []
    elif frizione == "alta":
        # Esperto: privilegia sfida e confronto
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("domanda_inline", "confronto")]
        support_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") == "insight"]
    else:
        # Bilanciato: prende tutto
        frizione_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("cloze", "domanda_inline")]
        support_mut = [m for m in tutte_le_mutazioni if m.get("tipo_ui") in ("insight", "confronto")]

    support_limit = 2 if dipendenza == "alta" else 1

    # Deduplication via object identity
    seen = set()
    selected = []
    for m in lacune_mut + frizione_mut + support_mut[:support_limit]:
        if id(m) not in seen:
            seen.add(id(m))
            selected.append(m)

    # Fallback: garantisci almeno 2 mutazioni
    if len(selected) < 2:
        for m in tutte_le_mutazioni:
            if id(m) not in seen:
                seen.add(id(m))
                selected.append(m)
            if len(selected) >= 2:
                break

    return selected[:4]


async def genera_documento_vivente(sezione_id: str, testo_chunk: str, profilo: dict):
    """
    L'orchestratore in azione: lancia i tool in parallelo e applica il filtro.
    """
    lacune = profilo.get("grafo_conoscenza", {}).get("lacune", [])

    risultati = await asyncio.gather(
        tool_agente_inquisitore(testo_chunk, lacune),
        tool_agente_mentore(testo_chunk)
    )

    tutte_mutazioni = [item for sublist in risultati for item in sublist]

    mutazioni_finali = applica_matrice_cognitiva(tutte_mutazioni, profilo)

    return mutazioni_finali
