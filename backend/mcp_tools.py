import json
import os


def leggi_user_brain():
    filepath = "data/user_brain.json"
    if not os.path.exists(filepath):
        return {
            "utente_id": "demo",
            "grafo_conoscenza": {"acquisiti": [], "in_corso": [], "lacune": []},
            "persona_comportamentale": {"velocita": "media", "dipendenza_aiuti": "media"}
        }
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def aggiorna_user_brain(concetto: str, esito: str):
    """Aggiorna il grafo in base all'interazione dell'utente in tempo reale"""
    brain = leggi_user_brain()
    
    if esito == "superato":
        if concetto not in brain["grafo_conoscenza"]["acquisiti"]:
            brain["grafo_conoscenza"]["acquisiti"].append(concetto)

        if concetto in brain["grafo_conoscenza"]["lacune"]:
            brain["grafo_conoscenza"]["lacune"].remove(concetto)
            
    elif esito == "fallito":
        if concetto not in brain["grafo_conoscenza"]["lacune"]:
            brain["grafo_conoscenza"]["lacune"].append(concetto)
            
    with open("data/user_brain.json", "w", encoding="utf-8") as f:
        json.dump(brain, f, indent=2)
    return brain


def recupera_chunk_vettoriale(sezione_id: str):
    """
    Simula una query al Vector DB. Invece di caricare tutto il PDF,
    carica solo il blocco di testo rilevante per quella sezione.
    """
    # In un'app reale qui ci sarebbe: collection.query(query_texts=[sezione_id])
    db_simulato = {
        "paragrafo_1": "L'Eduslop è la tendenza dell'AI a fornire la risposta finale (output) senza stimolare il ragionamento dello studente.",
        "paragrafo_2": "L'Active Learning richiede frizione. Le Desirable Difficulties, come i cloze test, aiutano a fissare la memoria a lungo termine."
    }
    return db_simulato.get(sezione_id, "Testo non trovato.")