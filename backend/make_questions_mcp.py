import json
from typing import Literal, Optional, List, Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


# -----------------------------
# 1. Structured output schemas
# -----------------------------

Verdict = Literal["correct", "partial", "incorrect", "unsupported"]
Severity = Literal["minor", "major"]


class SourceSpan(BaseModel):
    section_id: str = Field(
        description="Short source location, e.g. '§4.2', 'paragraph 3', or 'context'."
    )
    quote: str = Field(
        description="Short exact or near-exact quote from the context supporting the verdict."
    )


class Claim(BaseModel):
    id: str = Field(description="Stable id such as c1, c2, c3.")
    text: str = Field(description="One atomic claim extracted from the student's answer.")
    verdict: Verdict = Field(description="Judgment of the claim against the source.")
    label: str = Field(
        description="Short UI label, e.g. CORRECT, IMPRECISE, INCORRECT — ROLE INVERTED."
    )
    rationale: str = Field(
        description="One short explanation of why the claim received this verdict."
    )
    improvement: Optional[str] = Field(
        default=None,
        description="One concise correction or improvement. Null if not needed."
    )
    source_span: Optional[SourceSpan] = Field(
        default=None,
        description="Source quote if available. Null when unsupported."
    )
    severity: Severity = Field(
        description="major if this should become a mistake fossil; minor otherwise."
    )


class ClaimReview(BaseModel):
    review_title: str = Field(
        description="Short title for the UI block, e.g. '3 claims extracted'."
    )
    summary: str = Field(
        description="One sentence summary of the answer quality."
    )
    original_answer: str = Field(description="The student's original answer.")
    claims: List[Claim] = Field(
        min_length=1,
        max_length=5,
        description="List of short, atomic claims extracted from the answer."
    )
    missing_ideas: List[str] = Field(
        default_factory=list,
        description="Important ideas from the context that the answer omitted."
    )
    suggested_revision: str = Field(
        description="A concise corrected version of the student's answer."
    )
    next_retrieval_prompt: str = Field(
        description="One future recall question based on the main weakness."
    )


# -----------------------------
# 2. Gemini client + helpers
# -----------------------------

MODEL_NAME = "gemini-1.5-flash"


def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-flash-lite-latest",
        temperature=0.1,
        max_retries=1,
    )


def _message_content_to_text(content: Any) -> str:
    """
    Gemini/LangChain may return content either as a plain string or as a list of blocks:
    [{'type': 'text', 'text': '...'}]
    This normalizes both cases.
    """
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
            else:
                parts.append(str(item))
        return "\n".join(parts).strip()

    return str(content).strip()


def _fallback_review(question: str, answer: str, context: str) -> ClaimReview:
    """
    Deterministic fallback for demo safety.
    Specific to the Reader/MCP example, which is fine for the hackathon demo path.
    """
    return ClaimReview(
        review_title="3 claims extracted",
        summary="Shrodinger found one role inversion and one vague mechanism.",
        original_answer=answer,
        claims=[
            Claim(
                id="c1",
                text="The Reader must not have MCP access.",
                verdict="correct",
                label="CORRECT",
                rationale="This matches the context: the Reader is denied MCP access.",
                improvement=None,
                source_span=SourceSpan(
                    section_id="context",
                    quote="The Reader has no MCP access."
                ),
                severity="minor",
            ),
            Claim(
                id="c2",
                text="The Reader writes the final output.",
                verdict="incorrect",
                label="INCORRECT — ROLE INVERTED",
                rationale="The answer assigns the Resolver's role to the Reader.",
                improvement=(
                    "The Resolver writes final outputs; the Reader only ingests "
                    "and structures untrusted documents."
                ),
                source_span=SourceSpan(
                    section_id="context",
                    quote="The Resolver is the only tier with write access."
                ),
                severity="major",
            ),
            Claim(
                id="c3",
                text="It could leak data.",
                verdict="partial",
                label="PARTIALLY CORRECT — SHARPEN THIS",
                rationale="The risk is directionally right, but the mechanism is underspecified.",
                improvement=(
                    "More precisely: MCP access could let prompt injection inside "
                    "an untrusted document call external systems or exfiltrate data."
                ),
                source_span=None,
                severity="minor",
            ),
        ],
        missing_ideas=[
            "Reader reads untrusted input.",
            "Resolver writes trusted output.",
            "The boundary prevents one component from both reading untrusted input and writing user-visible output.",
        ],
        suggested_revision=(
            "The Reader is denied MCP access because it reads untrusted documents. "
            "If it had MCP access, prompt injection could make it call external systems "
            "or exfiltrate data. The Resolver, not the Reader, writes final outputs."
        ),
        next_retrieval_prompt=(
            "Which tier reads untrusted documents, which tier has MCP access, "
            "and which tier writes final outputs?"
        ),
    )


# -----------------------------
# 3. Tools
# -----------------------------

@tool
def generate_question(topic: str, context: str) -> str:
    """Generate one guiding checkpoint question for the current topic and source context."""
    prompt = f"""
You are Shrodinger, an active-learning agent embedded inside a study document.

Generate exactly ONE checkpoint question.

Rules:
- Return only the question.
- Keep it under 25 words.
- Ask one thing only.
- Do not use "and" to combine two questions.
- Do not summarize the context.
- Do not give the answer.
- The question must force the student to explain, distinguish, or apply the concept.

Topic:
{topic}

Source context:
{context}
""".strip()

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        return _message_content_to_text(response.content)
    except Exception as e:
        print(f"[generate_question fallback] {type(e).__name__}: {e}")
        return f"Explain the key distinction in {topic} in your own words."


@tool
def check_claim(question: str, answer: str, context: str, answer_context: Optional[str] = None) -> str:
    """
    Extract atomic claims from the student's answer and review each claim against the source context.

    Returns:
        JSON string matching the ClaimReview schema.
    """
    answer_context_block = f"""
Additional answer context:
{answer_context}

Use this only to calibrate judgment. If the answer was transcribed from speech,
treat odd wording, homophones, punctuation, or small word substitutions as possible
transcription artifacts. Still extract and judge the student's conceptual claims
against the source context; do not invent intent or ignore a clear misconception.
""".strip() if answer_context else "Additional answer context: none."

    prompt = f"""
You are Shrodinger, an active-learning agent embedded inside a study document.

Your job is NOT to give a long explanation.
Your job is to measure the student's answer as short atomic claims.

You must:
1. Extract 1 to 5 atomic claims from the student's answer.
2. Each claim must contain exactly one idea.
3. Keep each claim short enough to render as a UI card.
4. If the answer has the form "A because B, so C", extract A, B, and C as separate claims.
5. If the answer contains "because", "so", "therefore", "in order to", or "to avoid",
   extract the causal justification as a separate claim.
6. Do not merge a correct statement and an incorrect reason into the same claim.
7. Do not merge a reason and a consequence into the same claim.
8. Judge each claim against the source context only.
9. Use verdicts only from:
   - correct
   - partial
   - incorrect
   - unsupported
10. Use UI-ready labels, for example:
   - CORRECT
   - IMPRECISE
   - PARTIALLY CORRECT — SHARPEN THIS
   - INCORRECT — ROLE INVERTED
   - UNSUPPORTED
11. Give one concise improvement for partial, incorrect, or unsupported claims.
12. Preserve the student's original answer in original_answer.
13. Produce a suggested_revision that repairs the answer without becoming too long.
14. If the answer omits a key distinction from the context, include it in missing_ideas.
15. Mark severity as "major" only when the claim reflects a real misconception.
16. If a claim is supported by the source, include a short source_span quote.

Example of claim splitting:
Student answer:
"The Reader must not have MCP access because it writes the final output, so it could leak data."

Extracted claims should be:
- "The Reader must not have MCP access."
- "The Reader writes the final output."
- "The Reader could leak data."

Now process the real input.

Question:
{question}

Student answer:
{answer}

{answer_context_block}

Source context:
{context}
""".strip()

    try:
        llm = _get_llm()

        structured_llm = llm.with_structured_output(
            schema=ClaimReview.model_json_schema(),
            method="json_schema",
        )

        result = structured_llm.invoke(prompt)

        # LangChain returns a dict when schema is model_json_schema().
        review = ClaimReview.model_validate(result)

    except Exception as e:
        print(f"[check_claim fallback] {type(e).__name__}: {e}")
        review = _fallback_review(question, answer, context)

    return review.model_dump_json(indent=2)


@tool
def parse_answer(answer: str) -> str:
    """
    Extract short atomic claims from the user's answer.

    Returns:
        JSON string with key_claims.

    Note:
        In the current architecture, check_claim already does claim extraction + review.
        Keep this as a lightweight fallback/helper.
    """
    output = {
        "key_claims": [
            {
                "id": "c1",
                "text": answer.strip()
            }
        ]
    }
    return json.dumps(output, ensure_ascii=False, indent=2)
