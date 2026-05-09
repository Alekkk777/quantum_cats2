import os
import json
from typing import Literal
from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai

load_dotenv()


class Claim(BaseModel):
    id: str
    text: str
    verdict: Literal["correct", "partial", "incorrect", "unsupported"]
    label: str
    rationale: str
    improvement: str | None
    severity: Literal["minor", "major"]


class ClaimReview(BaseModel):
    review_title: str
    summary: str
    original_answer: str
    claims: list[Claim]
    missing_ideas: list[str]
    suggested_revision: str
    next_retrieval_prompt: str


client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

question = "Explain why the Reader tier must not have MCP access."

answer = (
    "The Reader must not have MCP access because it writes the final output, "
    "so it could leak data."
)

context = """
The Reader tier touches untrusted documents. It has Read and Grep only.
It has no MCP access, no write tools, and no bash.
The Orchestrator never touches untrusted documents directly and has MCP access
to trusted internal systems.
The Resolver is the only tier with write access.
"""

prompt = f"""
You are Shrodinger, an active-learning agent embedded inside a study document.

Return a structured claim review.

Instructions:
- Extract 1 to 5 short atomic claims from the student's answer.
- Each claim must contain exactly one idea.
- Judge each claim only against the source context.
- Use verdicts only: correct, partial, incorrect, unsupported.
- If the student's answer contains a causal justification introduced by "because", "so", "therefore", or "to avoid", extract that justification as a separate claim.
- Use short UI-ready labels, for example:
  CORRECT
  IMPRECISE
  INCORRECT — ROLE INVERTED
  UNSUPPORTED
- Give concise improvement text for partial, incorrect, or unsupported claims.
- Preserve the student's original answer.
- Suggested revision should be concise.

Question:
{question}

Student answer:
{answer}

Source context:
{context}
"""

response = client.models.generate_content(
    model="gemini-3.1-flash-lite",
    contents=prompt,
    config={
        "response_mime_type": "application/json",
        "response_schema": ClaimReview,
    },
)

print(response.text)

data = json.loads(response.text)
ClaimReview.model_validate(data)

print("\nPARSED OK")
print("Claims:", len(data["claims"]))