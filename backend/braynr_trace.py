import json
import os
import re
from pathlib import Path
from typing import Any


BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
DEFAULT_METADATA_PATH = REPO_ROOT / "origin_file" / "braynr-backup" / "metadata.json"

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
}


def _metadata_path() -> Path:
    configured = os.getenv("BRAYNR_METADATA_PATH")
    return Path(configured) if configured else DEFAULT_METADATA_PATH


def _load_metadata() -> dict[str, Any] | None:
    path = _metadata_path()
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[braynr metadata load skipped] {type(exc).__name__}: {exc}")
        return None


def _clean_text(value: Any, limit: int = 280) -> str:
    text = str(value or "")
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = text.replace("\n", " ")
    text = text.replace("\u00e2\u20ac\u201d", "-").replace("\u00e2\u20ac\u201c", "-")
    text = text.replace("\u00e2\u2020\u2019", "->").replace("\u00e2\u2020\u201d", "<->")
    text = text.replace("\u00e2\u20ac\u0153", '"').replace("\u00e2\u20ac\u009d", '"')
    text = text.replace("\u00e2\u20ac\u2122", "'")
    text = re.sub(r"\s+", " ", text).strip()
    text = text.encode("ascii", "ignore").decode("ascii")
    return text[: limit - 3].rstrip() + "..." if len(text) > limit else text


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text.lower())
    return {word for word in words if word not in STOPWORDS}


def _overlap_score(text: str, doc_tokens: set[str]) -> int:
    if not doc_tokens:
        return 0
    return len(_tokens(text) & doc_tokens)


def _book_signal(book: dict[str, Any]) -> str:
    parts = [
        book.get("title", ""),
        book.get("path", ""),
        " ".join(str(h.get("title", "")) for h in book.get("headings", [])[:20] if isinstance(h, dict)),
        " ".join(str(k.get("text", "")) for k in book.get("keywords", [])[:60] if isinstance(k, dict)),
    ]
    return " ".join(parts)


def _select_relevant_book(metadata: dict[str, Any], document_context: str) -> dict[str, Any] | None:
    books = [book for book in metadata.get("books", []) if isinstance(book, dict)]
    if not books:
        return None

    doc_tokens = _tokens(document_context)
    if not doc_tokens:
        return books[0]

    scored = [(_overlap_score(_book_signal(book), doc_tokens), book) for book in books]
    score, book = max(scored, key=lambda item: item[0])
    return book if score >= 2 else None


def _sorted_relevant(items: list[dict[str, Any]], doc_tokens: set[str], text_key: str, limit: int) -> list[dict[str, Any]]:
    return [
        item
        for _, item in sorted(
            ((_overlap_score(str(item.get(text_key, "")), doc_tokens), item) for item in items),
            key=lambda pair: pair[0],
            reverse=True,
        )[:limit]
    ]


def _fragility_signal(question: dict[str, Any]) -> tuple[bool, str]:
    card = question.get("Card") or {}
    results = question.get("results") or []
    difficulty = float(card.get("difficulty") or 0)
    lapses = int(card.get("lapses") or 0)
    low_rating = any(int(result.get("rating") or 0) <= 2 for result in results if isinstance(result, dict))
    if lapses > 0:
        return True, "lapsed"
    if low_rating:
        return True, "low recent rating"
    if difficulty >= 5.5:
        return True, "high difficulty"
    return False, "reviewed"


def _question_topic(question: dict[str, Any]) -> str:
    text = _clean_text(question.get("text", ""), 120)
    bold = re.findall(r"\*\*(.*?)\*\*", str(question.get("text", "")))
    if bold:
        return _clean_text(bold[0], 80)
    words = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text)
    return " ".join(words[:5]) if words else text


def _mindmap_lines(book: dict[str, Any], doc_tokens: set[str]) -> list[str]:
    lines: list[str] = []
    for mindmap in book.get("mindmaps", [])[:2]:
        diagram_raw = mindmap.get("diagram")
        if not diagram_raw:
            continue
        try:
            diagram = json.loads(diagram_raw)
        except Exception:
            continue

        nodes = {
            str(node.get("key")): _clean_text(node.get("text", ""), 90)
            for node in diagram.get("nodeDataArray", [])
            if isinstance(node, dict)
        }
        concepts = [
            text
            for text in nodes.values()
            if text and text.lower() != "add description" and _overlap_score(text, doc_tokens) > 0
        ][:8]
        if concepts:
            lines.append(f"Mindmap concepts: {', '.join(concepts)}.")

        relations = []
        for link in diagram.get("linkDataArray", [])[:40]:
            source = nodes.get(str(link.get("from")), "")
            target = nodes.get(str(link.get("to")), "")
            if source and target and source.lower() != "add description" and target.lower() != "add description":
                if _overlap_score(f"{source} {target}", doc_tokens) > 0:
                    relations.append(f"{source} -> {target}")
            if len(relations) >= 5:
                break
        if relations:
            lines.append(f"Mindmap relations: {'; '.join(relations)}.")
    return lines


def summarize_braynr_metadata(document_context: str = "") -> dict[str, Any]:
    metadata = _load_metadata()
    if not metadata:
        return {"loaded": False, "summary": "", "gap_terms": [], "book_title": None}

    book = _select_relevant_book(metadata, document_context)
    if not book:
        return {"loaded": False, "summary": "", "gap_terms": [], "book_title": None}

    doc_tokens = _tokens(document_context)
    lines: list[str] = [
        "Use this as learner cognitive trace only. Do not treat it as source evidence.",
        f"Braynr book: {_clean_text(book.get('title'), 160)}.",
    ]

    headings = [
        _clean_text(heading.get("title"), 90)
        for heading in book.get("headings", [])[:8]
        if isinstance(heading, dict) and heading.get("title")
    ]
    if headings:
        lines.append(f"Known document path: {'; '.join(headings)}.")

    keywords = _sorted_relevant(
        [item for item in book.get("keywords", []) if isinstance(item, dict)],
        doc_tokens,
        "text",
        10,
    )
    keyword_texts = [_clean_text(item.get("text"), 60) for item in keywords if item.get("text")]
    if keyword_texts:
        lines.append(f"Prior highlighted terms: {', '.join(dict.fromkeys(keyword_texts))}.")

    notes = _sorted_relevant(
        [item for item in book.get("notes", []) if isinstance(item, dict)],
        doc_tokens,
        "text",
        3,
    )
    for note in notes:
        title = _clean_text(note.get("title") or "note", 80)
        body = _clean_text(note.get("text"), 220)
        if body:
            lines.append(f"Student note - {title}: {body}")

    questions = [item for item in book.get("questions", []) if isinstance(item, dict)]
    questions = _sorted_relevant(questions, doc_tokens, "text", 8)
    gap_terms: list[str] = []
    for question in questions[:5]:
        fragile, signal = _fragility_signal(question)
        topic = _question_topic(question)
        if fragile and topic:
            gap_terms.append(topic)
        prompt = _clean_text(question.get("text"), 140)
        answer = _clean_text(question.get("answer"), 160)
        lines.append(f"Flashcard ({signal}): {prompt} | expected: {answer}")

    lines.extend(_mindmap_lines(book, doc_tokens))

    for chat in book.get("chats", [])[:3]:
        if not isinstance(chat, dict):
            continue
        user_messages = [
            _clean_text(message.get("content"), 160)
            for message in chat.get("messages", [])
            if isinstance(message, dict) and message.get("role") == "user"
        ]
        if user_messages:
            lines.append(f"Prior learner ask - {_clean_text(chat.get('title'), 60)}: {user_messages[0]}")

    summary = "\n".join(line for line in lines if line)
    if len(summary) > 3500:
        summary = summary[:3497].rstrip() + "..."

    return {
        "loaded": True,
        "summary": summary,
        "gap_terms": list(dict.fromkeys(gap_terms))[:8],
        "book_title": book.get("title"),
    }


def get_braynr_cognitive_trace(document_context: str = "") -> str:
    return summarize_braynr_metadata(document_context).get("summary", "")


def build_orchestrator_context(source_context: str, document_context: str | None = None) -> str:
    trace = get_braynr_cognitive_trace(document_context or source_context)
    if not trace:
        return source_context
    return (
        "Source document excerpt (authoritative for factual judgment):\n"
        f"{source_context}\n\n"
        "Learner cognitive trace from Braynr metadata "
        "(personalization only; not source evidence):\n"
        f"{trace}"
    )


def merge_learner_trace_summary(existing: str | None, document_context: str = "") -> str | None:
    trace = get_braynr_cognitive_trace(document_context)
    parts = [part.strip() for part in (existing, trace) if part and part.strip()]
    return "\n\n".join(parts) if parts else None


def enrich_profile_with_braynr_trace(profile: dict[str, Any], document_context: str = "") -> dict[str, Any]:
    trace_data = summarize_braynr_metadata(document_context)
    if not trace_data.get("loaded"):
        return profile

    enriched = dict(profile)
    grafo = dict(enriched.get("grafo_conoscenza") or {})
    lacune = list(grafo.get("lacune") or [])
    for term in trace_data.get("gap_terms", []):
        if term and term not in lacune:
            lacune.append(term)

    grafo["lacune"] = lacune
    enriched["grafo_conoscenza"] = grafo
    enriched["braynr_cognitive_trace"] = trace_data.get("summary", "")
    enriched["braynr_source_book"] = trace_data.get("book_title")
    return enriched
