import json
import os
import re
from typing import Literal, Optional, List, Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

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
    Uses the quantum demo fixture when the context is about Bell/entanglement,
    otherwise falls back to the older Reader/MCP checkpoint.
    """
    combined = f"{question}\n{context}".lower()
    if any(token in combined for token in ("bell", "entanglement", "locality", "realism", "hidden variable")):
        return ClaimReview(
            review_title="3 claims extracted",
            summary="Shrodinger found one correct direction and two important misconceptions about Bell's theorem.",
            original_answer=answer,
            claims=[
                Claim(
                    id="c1",
                    text="Locality can be preserved in the standard reading.",
                    verdict="correct",
                    label="CORRECT",
                    rationale="The context says most physicists preserve locality and abandon realism instead.",
                    improvement=None,
                    source_span=SourceSpan(
                        section_id="context",
                        quote="Most physicists accept that realism must be abandoned."
                    ),
                    severity="minor",
                ),
                Claim(
                    id="c2",
                    text="Hidden variables can explain quantum correlations while locality holds.",
                    verdict="incorrect",
                    label="INCORRECT - LOCAL REALISM",
                    rationale="Bell's theorem and experiments rule out local hidden-variable theories.",
                    improvement="No local hidden-variable theory can reproduce the observed quantum correlations.",
                    source_span=SourceSpan(
                        section_id="context",
                        quote="Experiments violate this bound."
                    ),
                    severity="major",
                ),
                Claim(
                    id="c3",
                    text="Realism can remain safe if locality is confirmed.",
                    verdict="incorrect",
                    label="INCORRECT - WRONG ASSUMPTION",
                    rationale="If locality is kept, realism is the assumption that must be abandoned to account for the experimental violation.",
                    improvement="If locality holds, realism must be abandoned.",
                    source_span=SourceSpan(
                        section_id="context",
                        quote="at least one assumption must be false"
                    ),
                    severity="major",
                ),
            ],
            missing_ideas=[
                "Bell's inequality follows from locality plus realism.",
                "Experiments violate Bell's bound.",
                "Keeping locality means abandoning realism, not saving hidden variables.",
            ],
            suggested_revision=(
                "If locality holds, realism must be abandoned. Bell's theorem shows that locality "
                "and realism together require Bell's inequality, but experiments violate it. "
                "So quantum particles cannot carry pre-existing definite properties."
            ),
            next_retrieval_prompt=(
                "If Bell experiments violate the bound while locality is kept, which assumption must be abandoned?"
            ),
        )

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
- The question must be written in English, even if the source context is Italian or multilingual.
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
17. Write every user-facing field in English: review_title, summary, claim text,
    label, rationale, improvement, missing_ideas, suggested_revision, and
    next_retrieval_prompt. If the source or answer is Italian, translate the
    conceptual content into natural English before rendering it.

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


# -----------------------------
# 4. Challenge / debate tool
# -----------------------------

def challenge_claim_live(
    claim_text: str,
    claim_verdict: str,
    student_challenge: str,
    original_question: str,
    context: str,
    history: list,
    demo_mode: bool = False,
) -> dict:
    """Shrodinger responds to a student's claim challenge."""
    if demo_mode:
        return {
            "response": (
                "I understand your challenge, but consider: Bell's inequality is not just about "
                "correlation strength — it establishes a mathematical bound that locality and realism "
                "together require. The experimental violations exceed this bound by a factor that rules "
                "out all local realistic models. Which specific step of Bell's derivation do you find "
                "unconvincing?"
            ),
            "stance": "affirm",
        }

    history_text = "\n".join(
        f"{'Student' if h.get('role') == 'student' else 'Shrodinger'}: {h.get('text', '')}"
        for h in history
    )

    prompt = f"""You are Shrodinger, an English-language academic study companion embedded in a physics learning app.

A student has challenged your claim assessment.

Source context:
{context}

Original question: {original_question}
Your assessment: "{claim_text}" — verdict: {claim_verdict}
Student's challenge: {student_challenge}
{"Prior exchanges:\\n" + history_text if history_text else ""}

Respond in 2-3 sentences:
- If the student raises a valid point, concede partially or fully
- If the student is mistaken, explain precisely why without being condescending
- End with a short probing follow-up question
- Be Socratic: guide through questions rather than assertions
- Write the response in English, even if the source or student challenge is Italian.

Return ONLY valid JSON: {{"response": "...", "stance": "affirm|concede|partial_concede"}}""".strip()

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        text = _message_content_to_text(response.content)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return {
                "response": data.get("response", "Let me reconsider."),
                "stance": data.get("stance", "affirm"),
            }
    except Exception as e:
        print(f"[challenge_claim fallback] {type(e).__name__}: {e}")

    return {
        "response": (
            "Your challenge is noted. Consider: the experimental violation exceeds "
            "the classical bound by more than 40σ — what alternative explanation "
            "could survive this margin?"
        ),
        "stance": "affirm",
    }


# -----------------------------
# 5. Text anchor / concept link tools
# -----------------------------

def generate_text_anchors_live(
    _document_id: str,
    selected_topics: list,
    document_excerpt: str,
    demo_mode: bool = False,
) -> dict:
    """Generate subtle text anchors for a document excerpt."""
    if demo_mode:
        with open(os.path.join(FIXTURES_DIR, "text_anchors_demo.json"), encoding="utf-8") as f:
            return {"anchors": json.load(f)}

    topics_str = ", ".join(selected_topics) if selected_topics else "all topics"
    prompt = f"""You are Shrodinger, an English-language academic study companion.

Generate exactly 3 text anchors for the source excerpt below.
Focus on: {topics_str}

Rules:
- Each anchor must be tied to a specific quote from the source.
- anchor_id should be "{_document_id}" when this excerpt is a single uploaded section.
- kind must be one of: definition, formula, warning, context, assumption, example
- priority must be one of: low, medium, high
- body must be 1-2 short sentences. No summaries. No generic advice.
- source_quote must be a short verbatim or near-verbatim excerpt.
- Write label and body in English, even if the source excerpt is Italian or multilingual.

Source:
{document_excerpt[:2000]}

Return ONLY valid JSON: {{"anchors": [{{
  "id": "ta-1", "anchor_id": "{_document_id}", "topic": "...", "kind": "...",
  "label": "...", "body": "...", "source_quote": "...",
  "priority": "high|medium|low", "collapsed_by_default": false
}}, ...]}}""".strip()

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        text = _message_content_to_text(response.content)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return {"anchors": data.get("anchors", [])}
    except Exception as e:
        print(f"[generate_text_anchors fallback] {type(e).__name__}: {e}")

    with open(os.path.join(FIXTURES_DIR, "text_anchors_demo.json"), encoding="utf-8") as f:
        return {"anchors": json.load(f)}


def generate_concept_links_live(
    _document_id: str,
    selected_topics: list,
    document_excerpt: str,
    learner_trace_summary: Optional[str],
    demo_mode: bool = False,
) -> dict:
    """Generate concept link annotations for a document."""
    if demo_mode:
        with open(os.path.join(FIXTURES_DIR, "concept_links_demo.json"), encoding="utf-8") as f:
            return {"links": json.load(f)}

    topics_str = ", ".join(selected_topics) if selected_topics else "all topics"
    prompt = f"""You are Shrodinger, an English-language academic study companion.

Generate exactly 3 concept links for the source excerpt below.
Focus on: {topics_str}

Rules:
- Each link connects two concepts from the source.
- anchor_id should be "{_document_id}" when this excerpt is a single uploaded section.
- relation must be one of: prerequisite, contrast, causes, supports, example_of, often_confused_with, applies_to
- explanation must be 1-2 short sentences. Ground in the source only.
- label format: "A <-> B"
- Write label and explanation in English, even if the source excerpt is Italian or multilingual.

Source:
{document_excerpt[:2000]}

{"Learner trace: " + learner_trace_summary if learner_trace_summary else ""}

Return ONLY valid JSON: {{"links": [{{
  "id": "cl-1", "from_concept": "...", "to_concept": "...",
  "relation": "...", "anchor_id": "{_document_id}",
  "label": "... <-> ...", "explanation": "...", "source_quote": "...",
  "priority": "high|medium|low", "collapsed_by_default": false
}}, ...]}}""".strip()

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        text = _message_content_to_text(response.content)
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return {"links": data.get("links", [])}
    except Exception as e:
        print(f"[generate_concept_links fallback] {type(e).__name__}: {e}")

    with open(os.path.join(FIXTURES_DIR, "concept_links_demo.json"), encoding="utf-8") as f:
        return {"links": json.load(f)}


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
