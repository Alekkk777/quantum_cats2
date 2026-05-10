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
    """Generate Friction mutations (Memory and Application)"""
    lacune_str = ", ".join(lacune) if lacune else "the main concepts in the text"
    prompt = f"""
    You are an academic Inquisitor. Analyze this text:
    {testo_chunk}

    The student's known gaps are: {lacune_str}

    Generate EXACTLY 2 JSON mutations:
    1. A 'cloze': hide a key word from the text (use ___ for the missing word in the 'contenuto' field). The 'target' field must be the exact word from the text.
    2. A 'domanda_inline': a critical application question about the main concept.

    Reply ONLY with valid JSON following the provided schema.
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
    """Generate Support mutations (Understanding and Elaboration)"""
    prompt = f"""
    You are a Study Companion. Analyze this text:
    {testo_chunk}

    Generate EXACTLY 2 JSON mutations:
    1. An 'insight': explain a difficult concept with a practical, concrete example.
    2. A 'confronto': highlight the difference between two concepts in the text.

    Reply ONLY with valid JSON following the provided schema.
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