import asyncio
from agents import tool_agente_inquisitore, tool_agente_mentore

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
    e alle conoscenze (Grafo).
    """
    mutazioni_scelte = []
    persona = profilo.get("persona_comportamentale", {})
    grafo = profilo.get("grafo_conoscenza", {})
    
    for mut in tutte_le_mutazioni:
        
        if persona.get("velocita") == "alta" and mut["fase_pacrar"] == "Comprensione":
            mutazioni_scelte.append(mut)
            
        elif persona.get("self_assessment") == "esperto" and mut["fase_pacrar"] == "Ricordo":
            mutazioni_scelte.append(mut)
            

        elif mut.get("target") in grafo.get("lacune", []):
            mutazioni_scelte.append(mut)


    if not mutazioni_scelte and tutte_le_mutazioni:
        return [tutte_le_mutazioni[0]]
        
    return mutazioni_scelte[:2]


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