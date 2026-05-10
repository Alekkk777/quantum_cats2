import os
import shutil
import json
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingest import elabora_documento
from mcp_tools import (
    leggi_user_brain,
    aggiorna_user_brain,
    recupera_chunk_vettoriale,
    lista_sezioni,
)
from orchestrator import genera_documento_vivente, genera_domande_pianificazione
from make_questions_mcp import check_claim as _check_claim_tool, generate_question as _gen_question_tool

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

app = FastAPI(title="Braynr / Schrodinger Study Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ────────────────────────────────────────────────────────

class StudyRequest(BaseModel):
    sezione_id: str

class InteractionRequest(BaseModel):
    concetto_target: str
    esito: str          # "superato" o "fallito"
    sezione_attuale_id: str

class PlanningSubmit(BaseModel):
    obiettivo: str
    velocita: str
    self_assessment: str

class GenerateQuestionRequest(BaseModel):
    topic: str
    context: str

class CheckClaimRequest(BaseModel):
    question: str
    answer: str
    context: str
    demo_mode: bool = False


# ── Core endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """React invia il file qui. Salviamo e vettorializziamo istantaneamente."""
    os.makedirs(DATA_DIR, exist_ok=True)
    safe_name = os.path.basename(file.filename or "documento.md")
    file_path = os.path.join(DATA_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        elabora_documento(file_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    sections = lista_sezioni()

    return {
        "status": "success",
        "message": f"Documento '{safe_name}' ingerito con {len(sections)} sezioni.",
        "sezioni": sections,
    }


@app.get("/api/planning")
async def get_planning_questions():
    """React chiama questo appena l'utente carica il PDF."""
    return genera_domande_pianificazione()


@app.post("/api/init-persona")
async def init_user_persona(data: PlanningSubmit):
    """React chiama questo quando l'utente finisce il form iniziale."""
    nuovo_profilo = {
        "utente_id": "studente_hackathon",
        "grafo_conoscenza": {
            "acquisiti": [],
            "in_corso": [],
            "lacune": [],
        },
        "persona_comportamentale": {
            "velocita": "alta" if "fretta" in data.velocita.lower() else "media",
            "frizione_preferita": "alta" if "esperto" in data.self_assessment.lower() else "bilanciata",
            "dipendenza_aiuti": "bassa" if "esperto" in data.self_assessment.lower() else "alta",
            "obiettivo": data.obiettivo,
            "errori_consecutivi": 0,
        },
        "sessione": {
            "interazioni_totali": 0,
            "ultimo_aggiornamento": "",
        },
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(os.path.join(DATA_DIR, "user_brain.json"), "w", encoding="utf-8") as f:
        json.dump(nuovo_profilo, f, indent=2, ensure_ascii=False)

    return {"status": "persona_creata", "profilo": nuovo_profilo}


@app.get("/api/sections")
async def get_sections():
    """Ritorna la lista delle sezioni disponibili nel documento caricato."""
    sezioni = lista_sezioni()
    return {"sezioni": sezioni}


@app.post("/api/study-mode")
async def start_study_mode(request: StudyRequest):
    """React chiama questo quando l'utente inizia a leggere una sezione."""
    testo_chunk = recupera_chunk_vettoriale(request.sezione_id)
    profilo = leggi_user_brain()

    try:
        mutazioni = await genera_documento_vivente(request.sezione_id, testo_chunk, profilo)
    except Exception as e:
        print(f"[study-mode error] {type(e).__name__}: {e}")
        mutazioni = []

    return {
        "testo_originale": testo_chunk,
        "mutazioni_attive": mutazioni,
        "stato_grafo": profilo.get("grafo_conoscenza", {}),
    }


@app.post("/api/interact")
async def handle_user_interaction(request: InteractionRequest):
    """React chiama questo in background quando l'utente risponde a una mutazione."""
    nuovo_profilo = aggiorna_user_brain(request.concetto_target, request.esito)
    testo_chunk = recupera_chunk_vettoriale(request.sezione_attuale_id)

    try:
        nuove_mutazioni = await genera_documento_vivente(
            request.sezione_attuale_id, testo_chunk, nuovo_profilo
        )
    except Exception as e:
        print(f"[interact error] {type(e).__name__}: {e}")
        nuove_mutazioni = []

    return {
        "status": "grafo_aggiornato",
        "nuovo_stato": nuovo_profilo.get("grafo_conoscenza", {}),
        "mutazioni_conseguenti": nuove_mutazioni,
    }


# ── Quantum Cats / Schrodinger endpoints (usati dal frontend demo) ─────────

@app.post("/generate-question")
async def generate_question_endpoint(req: GenerateQuestionRequest):
    """Genera una domanda checkpoint per il documento corrente."""
    result = _gen_question_tool.invoke({"topic": req.topic, "context": req.context})
    return {"question": result}


@app.post("/check-claim")
async def check_claim_endpoint(req: CheckClaimRequest):
    """Valuta le claim della risposta dello studente."""
    result_json = _check_claim_tool.invoke({
        "question": req.question,
        "answer": req.answer,
        "context": req.context,
    })
    return json.loads(result_json)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
