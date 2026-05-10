import asyncio
import json
import os

import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-flash-lite-latest")


class MutazionePACRAR(BaseModel):
    fase_pacrar: str = Field(description="'Ricordo', 'Applicazione', 'Comprensione', or 'Rielaborazione'.")
    tipo_ui: str = Field(description="'cloze', 'insight', 'domanda_inline', or 'confronto'.")
    target: str = Field(description="The exact word or phrase from the source text to attach the intervention to.")
    contenuto: str = Field(description="The English text of the question, example, or hint.")


class OutputAgente(BaseModel):
    mutazioni: list[MutazionePACRAR]


async def tool_agente_inquisitore(testo_chunk: str, lacune: list):
    """Generate friction mutations for retrieval and application."""
    lacune_str = ", ".join(lacune) if lacune else "the main concepts in the text"
    prompt = f"""
You are an academic Inquisitor embedded in Shrodinger, an English-language study app.

Analyze this source text:
{testo_chunk}

The student's known gaps are: {lacune_str}

Generate exactly 2 JSON mutations:
1. A 'cloze': hide a key word from the text. Use ___ for the missing word in the 'contenuto' field. The 'target' field must be the exact word from the text.
2. A 'domanda_inline': a critical application question about the main concept.

Language rule:
- All user-facing generated content in 'contenuto' must be English, even if the source text or gaps are Italian or multilingual.
- If the source is not English, translate the question/hint into natural English.

Reply only with valid JSON following the provided schema.
""".strip()
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=OutputAgente,
            temperature=0.8,
        ),
    )
    return json.loads(response.text).get("mutazioni", [])


async def tool_agente_mentore(testo_chunk: str):
    """Generate support mutations for understanding and elaboration."""
    prompt = f"""
You are a Study Companion embedded in Shrodinger, an English-language study app.

Analyze this source text:
{testo_chunk}

Generate exactly 2 JSON mutations:
1. An 'insight': explain a difficult concept with a practical, concrete example.
2. A 'confronto': highlight the difference between two concepts in the text.

Language rule:
- All user-facing generated content in 'contenuto' must be English, even if the source text is Italian or multilingual.
- If the source is not English, translate the explanation into natural English.

Reply only with valid JSON following the provided schema.
""".strip()
    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=OutputAgente,
            temperature=0.7,
        ),
    )
    return json.loads(response.text).get("mutazioni", [])
