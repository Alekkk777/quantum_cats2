import json
import os
import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _brain_path():
    return os.path.join(DATA_DIR, "user_brain.json")


def _chunks_path():
    return os.path.join(DATA_DIR, "source_chunks.json")


def leggi_user_brain():
    path = _brain_path()
    if not os.path.exists(path):
        return {
            "utente_id": "demo",
            "grafo_conoscenza": {"acquisiti": [], "in_corso": [], "lacune": []},
            "persona_comportamentale": {
                "velocita": "media",
                "frizione_preferita": "bilanciata",
                "errori_consecutivi": 0,
            },
            "sessione": {
                "interazioni_totali": 0,
                "ultimo_aggiornamento": "",
            },
        }
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def salva_user_brain(brain: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(_brain_path(), "w", encoding="utf-8") as f:
        json.dump(brain, f, indent=2, ensure_ascii=False)


def aggiorna_user_brain(concetto: str, esito: str):
    """Aggiorna il grafo in base all'interazione dell'utente in tempo reale."""
    brain = leggi_user_brain()

    grafo = brain.setdefault("grafo_conoscenza", {"acquisiti": [], "in_corso": [], "lacune": []})

    if esito == "superato":
        if concetto not in grafo["acquisiti"]:
            grafo["acquisiti"].append(concetto)
        if concetto in grafo["lacune"]:
            grafo["lacune"].remove(concetto)
    elif esito == "fallito":
        if concetto not in grafo["lacune"]:
            grafo["lacune"].append(concetto)

    salva_user_brain(brain)
    return brain


def recupera_chunk_vettoriale(sezione_id: str) -> str:
    """Legge il chunk dalla source_chunks.json generata dall'ingest."""
    chunks_path = _chunks_path()
    if not os.path.exists(chunks_path):
        return f"Sezione '{sezione_id}' non trovata. Carica prima un documento."

    with open(chunks_path, "r", encoding="utf-8") as f:
        db = json.load(f)

    return db.get(sezione_id, f"Sezione '{sezione_id}' non trovata nel documento.")


def lista_sezioni() -> list[str]:
    """Restituisce la lista degli ID delle sezioni disponibili."""
    chunks_path = _chunks_path()
    if not os.path.exists(chunks_path):
        return []
    with open(chunks_path, "r", encoding="utf-8") as f:
        db = json.load(f)
    return list(db.keys())


def mcp_sincronizza_conoscenza(concetto: str, esito: str, tempo_risposta: float):
    """
    Cuore del loop: riceve i dati da React e aggiorna il cervello locale.
    """
    brain = leggi_user_brain()

    grafo = brain.setdefault("grafo_conoscenza", {"acquisiti": [], "in_corso": [], "lacune": []})
    persona = brain.setdefault("persona_comportamentale", {"velocita": "media", "errori_consecutivi": 0})
    sessione = brain.setdefault("sessione", {"interazioni_totali": 0, "ultimo_aggiornamento": ""})

    if esito == "successo":
        if concetto in grafo["lacune"]:
            grafo["lacune"].remove(concetto)
        if concetto not in grafo["acquisiti"]:
            grafo["acquisiti"].append(concetto)
        persona["errori_consecutivi"] = 0
    else:
        if concetto not in grafo["lacune"]:
            grafo["lacune"].append(concetto)
        persona["errori_consecutivi"] = persona.get("errori_consecutivi", 0) + 1

    if tempo_risposta < 5:
        persona["velocita"] = "alta"

    sessione["interazioni_totali"] = sessione.get("interazioni_totali", 0) + 1
    sessione["ultimo_aggiornamento"] = str(datetime.datetime.now())

    salva_user_brain(brain)
    return brain
