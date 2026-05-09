from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn


from mcp_tools import leggi_user_brain, aggiorna_user_brain, recupera_chunk_vettoriale
from orchestrator import genera_documento_vivente, genera_domande_pianificazione

app = FastAPI(title="Braynr Study Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudyRequest(BaseModel):
    sezione_id: str

class InteractionRequest(BaseModel):
    concetto_target: str
    esito: str  # "superato" o "fallito"
    sezione_attuale_id: str


@app.get("/api/planning")
async def get_planning_questions():
    """React chiama questo appena l'utente carica il PDF."""
    return genera_domande_pianificazione()

@app.post("/api/study-mode")
async def start_study_mode(request: StudyRequest):
    """React chiama questo quando l'utente inizia a leggere una sezione."""
    testo_chunk = recupera_chunk_vettoriale(request.sezione_id)
    profilo = leggi_user_brain()
    
    mutazioni = await genera_documento_vivente(request.sezione_id, testo_chunk, profilo)
    
    return {
        "testo_originale": testo_chunk,
        "mutazioni_attive": mutazioni,
        "stato_grafo": profilo.get("grafo_conoscenza", {})
    }


@app.post("/api/interact")
async def handle_user_interaction(request: InteractionRequest):
    """React chiama questo in background quando l'utente clicca una risposta."""
    nuovo_profilo = aggiorna_user_brain(request.concetto_target, request.esito)
    
    testo_chunk = recupera_chunk_vettoriale(request.sezione_attuale_id)
    
    nuove_mutazioni = await genera_documento_vivente(request.sezione_attuale_id, testo_chunk, nuovo_profilo)
    
    return {
        "status": "grafo_aggiornato",
        "nuovo_stato": nuovo_profilo.get("grafo_conoscenza", {}),
        "mutazioni_conseguenti": nuove_mutazioni
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)