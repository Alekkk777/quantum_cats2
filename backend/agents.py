import asyncio
import json
import google.generativeai as genai
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-flash-lite-latest')


class MutazionePACRAR(BaseModel):
    fase_pacrar: str = Field(description="'Ricordo', 'Applicazione', 'Comprensione' o 'Rielaborazione'")
    tipo_ui: str = Field(description="'cloze', 'insight', 'domanda_inline', 'confronto'")
    target: str = Field(description="La frase o parola ESATTA nel testo sorgente a cui agganciarsi")
    contenuto: str = Field(description="Il testo della domanda, dell'esempio o del suggerimento")

class OutputAgente(BaseModel):
    mutazioni: list[MutazionePACRAR]


async def tool_agente_inquisitore(testo_chunk: str, lacune: list):
    """Genera Frizione (Ricordo e Applicazione)"""
    lacune_str = ", ".join(lacune) if lacune else "concetti principali del testo"
    prompt = f"""
    Sei un Inquisitore accademico. Analizza questo testo:
    {testo_chunk}

    Le lacune note dello studente sono: {lacune_str}

    Genera ESATTAMENTE 2 mutazioni JSON:
    1. Un 'cloze': oscura una parola chiave del testo (usa ___ per la parola mancante nel campo 'contenuto'). Il campo 'target' deve essere la parola esatta nel testo.
    2. Una 'domanda_inline': una domanda critica di applicazione sul concetto principale.

    Rispondi SOLO con JSON valido seguendo lo schema fornito.
    """
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=OutputAgente,
            temperature=0.8
        )
    )
    return json.loads(response.text).get("mutazioni", [])


async def tool_agente_mentore(testo_chunk: str):
    """Genera Supporto (Comprensione e Rielaborazione)"""
    prompt = f"""
    Sei uno Study Companion. Analizza questo testo:
    {testo_chunk}

    Genera ESATTAMENTE 2 mutazioni JSON:
    1. Un 'insight': spiega un concetto ostico con un esempio pratico e concreto.
    2. Un 'confronto': evidenzia la differenza tra due concetti del testo.

    Rispondi SOLO con JSON valido seguendo lo schema fornito.
    """
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=OutputAgente,
            temperature=0.7
        )
    )
    return json.loads(response.text).get("mutazioni", [])