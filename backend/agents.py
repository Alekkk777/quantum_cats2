import asyncio
import json
import google.generativeai as genai
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')


class MutazionePACRAR(BaseModel):
    fase_pacrar: str = Field(description="'Ricordo', 'Applicazione', 'Comprensione' o 'Rielaborazione'")
    tipo_ui: str = Field(description="'cloze', 'insight', 'domanda_inline', 'confronto'")
    target: str = Field(description="La frase o parola ESATTA nel testo sorgente a cui agganciarsi")
    contenuto: str = Field(description="Il testo della domanda, dell'esempio o del suggerimento")

class OutputAgente(BaseModel):
    mutazioni: list[MutazionePACRAR]


async def tool_agente_mentore(testo_chunk: str):
    """Genera Supporto (Comprensione e Rielaborazione)"""
    prompt = f"""
    Sei uno Study Companion. Analizza questo testo:
    {testo_chunk}
    
    Genera:
    1. Un 'insight' che spieghi un concetto ostico con un esempio pratico.
    2. Un 'confronto' che evidenzi la differenza tra due concetti del testo.
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