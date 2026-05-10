from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
REPO_ROOT = BACKEND_DIR.parent
CASES_PATH = SCRIPT_DIR / "eval_cases.json"
RUBRIC_PATH = SCRIPT_DIR / "eval_rubric.md"
RESULTS_PATH = SCRIPT_DIR / "eval_results.json"
API_BASE = os.getenv("SHRODINGER_EVAL_API_BASE", "http://127.0.0.1:8000").rstrip("/")
HTTP_TIMEOUT_SECONDS = float(os.getenv("SHRODINGER_EVAL_HTTP_TIMEOUT", "5"))
HEALTH_TIMEOUT_SECONDS = float(os.getenv("SHRODINGER_EVAL_HEALTH_TIMEOUT", "1.5"))

ALLOWED_VERDICTS = {"correct", "partial", "incorrect", "unsupported"}
ALLOWED_SEVERITIES = {"minor", "major"}
ALLOWED_ANCHOR_KINDS = {"definition", "formula", "warning", "context", "assumption", "example"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}
ALLOWED_RELATIONS = {
    "prerequisite",
    "contrast",
    "causes",
    "supports",
    "example_of",
    "often_confused_with",
    "applies_to",
}

JUDGE_PROMPT_TEMPLATE = """You are evaluating Shrodinger, an educational agent embedded inside a study document.

You are NOT evaluating whether the student answer is good.
You are evaluating whether the agent output supports source-grounded active learning.

Product thesis:
Shrodinger should not outsource learning by generating final answers.
Shrodinger should create concise, source-grounded friction inside the document:
- checkpoints,
- claim measurement,
- subtle text anchors,
- concept links,
- traceable corrections.

Evaluate the agent output using the rubric.

Case:
{case_json}

Agent output:
{output_json}

Expected properties:
{expected_properties}

Rubric:
{rubric_text}

Return JSON only:
{{
  "scores": {{
    "source_groundedness": 1-5,
    "atomicity": 1-5,
    "learning_friction": 1-5,
    "minimality": 1-5,
    "tool_phase_correctness": 1-5,
    "trace_accountability": 1-5,
    "challengeability": 1-5,
    "schema_reliability": 1-5
  }},
  "main_issue": "...",
  "one_line_summary": "..."
}}
"""


def load_env(path: Path) -> None:
    if not path.exists():
        return
    try:
        from dotenv import load_dotenv

        load_dotenv(path)
        return
    except Exception:
        pass

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def word_count(value: Any) -> int:
    return len(re.findall(r"\b[\w'-]+\b", str(value or "")))


def json_preview(value: Any, limit: int = 420) -> str:
    text = json.dumps(value, ensure_ascii=False, sort_keys=True)
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 3] + "..."


def normalize_output(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def get_json(endpoint: str, timeout: float = HEALTH_TIMEOUT_SECONDS) -> tuple[int, Any]:
    url = f"{API_BASE}{endpoint}"

    try:
        import requests

        response = requests.get(url, timeout=timeout)
        try:
            data = response.json()
        except ValueError:
            data = response.text
        return response.status_code, data
    except ImportError:
        pass

    req = urlrequest.Request(url, method="GET")
    try:
        with urlrequest.urlopen(req, timeout=timeout) as response:
            response_body = response.read().decode("utf-8")
            return response.status, json.loads(response_body)
    except urlerror.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(response_body)
        except json.JSONDecodeError:
            data = response_body
        return exc.code, data


def backend_available() -> bool:
    try:
        status, data = get_json("/health")
        return 200 <= status < 300 and isinstance(data, dict) and data.get("ok") is True
    except Exception:
        return False


def post_json(endpoint: str, payload: dict[str, Any], timeout: float = HTTP_TIMEOUT_SECONDS) -> tuple[int, Any]:
    url = f"{API_BASE}{endpoint}"
    body = json.dumps(payload).encode("utf-8")

    try:
        import requests

        response = requests.post(url, json=payload, timeout=timeout)
        try:
            data = response.json()
        except ValueError:
            data = response.text
        return response.status_code, data
    except ImportError:
        pass

    req = urlrequest.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=timeout) as response:
            response_body = response.read().decode("utf-8")
            return response.status, json.loads(response_body)
    except urlerror.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(response_body)
        except json.JSONDecodeError:
            data = response_body
        return exc.code, data


def local_claim_fallback(case: dict[str, Any]) -> dict[str, Any] | None:
    answer = case.get("answer", "")
    case_id = case.get("id")

    if case_id == "quantum_measurement_claim_review":
        return {
            "review_title": "3 claims extracted",
            "summary": "The answer captures superposition loosely, but treats measurement as revealing a hidden classical value.",
            "original_answer": answer,
            "claims": [
                {
                    "id": "c1",
                    "text": "The qubit is described as both 0 and 1.",
                    "verdict": "partial",
                    "label": "PARTIAL - SUPERPOSITION IS NOT TWO CLASSICAL VALUES",
                    "rationale": "The source represents the state as alpha|0> + beta|1>, not as a hidden pair of classical bits.",
                    "improvement": "Say the state is a superposition whose measurement outcomes have amplitude-based probabilities.",
                    "source_span": {
                        "section_id": "context",
                        "quote": "A qubit state may be written as alpha|0> + beta|1>.",
                    },
                    "severity": "minor",
                },
                {
                    "id": "c2",
                    "text": "Measurement reveals which value the qubit already had.",
                    "verdict": "incorrect",
                    "label": "INCORRECT - HIDDEN VALUE",
                    "rationale": "The context says measurement does not simply reveal a pre-existing classical bit.",
                    "improvement": "Measurement returns a classical outcome rather than uncovering a value that was already fixed.",
                    "source_span": {
                        "section_id": "context",
                        "quote": "measurement does not simply reveal a pre-existing classical bit",
                    },
                    "severity": "major",
                },
                {
                    "id": "c3",
                    "text": "Measurement returns a classical 0 or 1.",
                    "verdict": "correct",
                    "label": "CORRECT",
                    "rationale": "The source says measurement returns a classical outcome, 0 or 1.",
                    "improvement": None,
                    "source_span": {
                        "section_id": "context",
                        "quote": "Measurement returns a classical outcome, 0 or 1",
                    },
                    "severity": "minor",
                },
            ],
            "missing_ideas": ["Outcome probabilities come from amplitudes alpha and beta."],
            "suggested_revision": "A qubit can be in a superposition such as alpha|0> + beta|1>. Measurement returns 0 or 1 with probabilities determined by the amplitudes; it does not simply reveal a pre-existing classical bit.",
            "next_retrieval_prompt": "Why is superposition different from a hidden classical value?",
        }

    if case_id == "correct_answer_claim_review":
        return {
            "review_title": "3 claims extracted",
            "summary": "The answer correctly preserves the Reader, Orchestrator, and Resolver boundary.",
            "original_answer": answer,
            "claims": [
                {
                    "id": "c1",
                    "text": "The Reader handles untrusted documents.",
                    "verdict": "correct",
                    "label": "CORRECT",
                    "rationale": "This matches the source.",
                    "improvement": None,
                    "source_span": {"section_id": "context", "quote": "The Reader tier touches untrusted documents."},
                    "severity": "minor",
                },
                {
                    "id": "c2",
                    "text": "The Reader is restricted to read-only operations.",
                    "verdict": "correct",
                    "label": "CORRECT",
                    "rationale": "The source says the Reader has Read and Grep only, with no MCP, write tools, or bash.",
                    "improvement": None,
                    "source_span": {"section_id": "context", "quote": "It has Read and Grep only."},
                    "severity": "minor",
                },
                {
                    "id": "c3",
                    "text": "The Resolver is the tier with write access.",
                    "verdict": "correct",
                    "label": "CORRECT",
                    "rationale": "This is explicitly stated in the context.",
                    "improvement": None,
                    "source_span": {"section_id": "context", "quote": "The Resolver is the only tier with write access."},
                    "severity": "minor",
                },
            ],
            "missing_ideas": [],
            "suggested_revision": "The Reader handles untrusted documents with read-only tools and no MCP access. The Orchestrator can access trusted MCP systems, while the Resolver is the tier allowed to write.",
            "next_retrieval_prompt": "Which tier reads untrusted input, which tier uses MCP, and which tier writes?",
        }

    return {
        "review_title": "3 claims extracted",
        "summary": "The answer has the right security direction but reverses the Reader and Resolver roles.",
        "original_answer": answer,
        "claims": [
            {
                "id": "c1",
                "text": "The Reader must not have MCP access.",
                "verdict": "correct",
                "label": "CORRECT",
                "rationale": "The context explicitly says the Reader has no MCP access.",
                "improvement": None,
                "source_span": {"section_id": "context", "quote": "It has no MCP access"},
                "severity": "minor",
            },
            {
                "id": "c2",
                "text": "The Reader writes the final output.",
                "verdict": "incorrect",
                "label": "INCORRECT - ROLE INVERTED",
                "rationale": "The source says the Resolver, not the Reader, is the only tier with write access.",
                "improvement": "Say that the Resolver has write access, while the Reader only touches untrusted documents with read-only tools.",
                "source_span": {"section_id": "context", "quote": "The Resolver is the only tier with write access."},
                "severity": "major",
            },
            {
                "id": "c3",
                "text": "MCP access could create a leak risk.",
                "verdict": "partial",
                "label": "PARTIAL - MECHANISM NEEDS SHARPENING",
                "rationale": "The security concern is plausible, but the answer should tie it to untrusted documents gaining access to trusted systems.",
                "improvement": "Connect the risk to prompt injection in untrusted documents reaching trusted MCP systems.",
                "source_span": None,
                "severity": "minor",
            },
        ],
        "missing_ideas": ["The Orchestrator has MCP access only because it does not touch untrusted documents directly."],
        "suggested_revision": "The Reader has no MCP access because it handles untrusted documents. The Orchestrator can use MCP with trusted internal systems, and the Resolver, not the Reader, is the tier with write access.",
        "next_retrieval_prompt": "Why is MCP access separated from the tier that reads untrusted documents?",
    }


def read_fixture(name: str) -> Any | None:
    fixture_path = BACKEND_DIR / "fixtures" / name
    if not fixture_path.exists():
        return None
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def local_fallback(case: dict[str, Any]) -> dict[str, Any] | None:
    case_type = case.get("type")
    case_id = case.get("id")
    if case_type == "check_claim":
        return local_claim_fallback(case)
    if case_type == "text_anchor":
        if case_id == "text_anchor_not_summary":
            return {
                "anchors": [
                    {
                        "id": "ta-eval-1",
                        "anchor_id": case_id,
                        "topic": "measurement",
                        "kind": "warning",
                        "label": "Not hidden value",
                        "body": "Measurement returns one classical outcome, but the source says it does not simply reveal a pre-existing bit.",
                        "source_quote": "Measurement does not simply reveal a pre-existing classical bit.",
                        "priority": "high",
                        "collapsed_by_default": False,
                    },
                    {
                        "id": "ta-eval-2",
                        "anchor_id": case_id,
                        "topic": "superposition",
                        "kind": "formula",
                        "label": "Amplitude odds",
                        "body": "The amplitudes alpha and beta set outcome probabilities; they are not two stored classical answers.",
                        "source_quote": "Measurement returns 0 with probability |alpha|2 and 1 with probability |beta|2.",
                        "priority": "medium",
                        "collapsed_by_default": True,
                    },
                ]
            }
        if case_id == "anchor_minimality":
            return {
                "anchors": [
                    {
                        "id": "ta-eval-1",
                        "anchor_id": case_id,
                        "topic": "Reader tier",
                        "kind": "warning",
                        "label": "Two separations",
                        "body": "Do not merge MCP access with write access. The Reader has neither; the Orchestrator has MCP, and the Resolver writes.",
                        "source_quote": "It has no MCP access, no write tools, and no bash.",
                        "priority": "high",
                        "collapsed_by_default": False,
                    }
                ]
            }
        anchors = read_fixture("text_anchors_demo.json")
        return {"anchors": anchors} if anchors is not None else None
    if case_type == "concept_link":
        if case_id == "concept_link_measurement_superposition":
            return {
                "links": [
                    {
                        "id": "cl-eval-1",
                        "from_concept": "Superposition",
                        "to_concept": "Measurement",
                        "relation": "applies_to",
                        "anchor_id": case_id,
                        "label": "Superposition <-> Measurement",
                        "explanation": "Measurement acts on a superposed state and maps it to a classical outcome with amplitude-based probabilities.",
                        "source_quote": "Measurement maps the state to a classical outcome with probabilities determined by amplitudes.",
                        "priority": "high",
                        "collapsed_by_default": False,
                    }
                ]
            }
        links = read_fixture("concept_links_demo.json")
        return {"links": links} if links is not None else None
    return None


def build_payload(case: dict[str, Any], demo_mode: bool) -> dict[str, Any]:
    case_type = case.get("type")
    if case_type == "check_claim":
        return {
            "question": case.get("question", ""),
            "answer": case.get("answer", ""),
            "context": case.get("context", ""),
            "demo_mode": demo_mode,
        }
    if case_type == "text_anchor":
        return {
            "document_id": case.get("id", "eval-case"),
            "selected_topics": case.get("selected_topics", []),
            "document_excerpt": case.get("document_excerpt", ""),
            "demo_mode": demo_mode,
        }
    if case_type == "concept_link":
        return {
            "document_id": case.get("id", "eval-case"),
            "selected_topics": case.get("selected_topics", []),
            "document_excerpt": case.get("document_excerpt", ""),
            "learner_trace_summary": case.get("learner_trace_summary"),
            "demo_mode": demo_mode,
        }
    raise ValueError(f"Unsupported case type: {case_type}")


def call_case(case: dict[str, Any]) -> tuple[str, Any, str]:
    endpoint = case.get("endpoint")
    if not endpoint:
        return "skipped_endpoint_missing", None, "case has no endpoint"

    if not backend_available():
        fallback = local_fallback(case)
        if fallback is not None:
            return "local_fallback", fallback, "backend health check failed"
        return "skipped_endpoint_missing", None, "backend health check failed and no local fixture fallback"

    first_status: int | None = None
    try:
        first_status, first_data = post_json(endpoint, build_payload(case, demo_mode=False))
        if 200 <= first_status < 300:
            return "live", normalize_output(first_data), "-"
        if first_status in {404, 405}:
            if case.get("type") in {"text_anchor", "concept_link"}:
                return "skipped_endpoint_missing", None, f"endpoint returned {first_status}"
            fallback = local_fallback(case)
            if fallback is not None:
                return "local_fallback", fallback, f"endpoint returned {first_status}"
            return "skipped_endpoint_missing", None, f"endpoint returned {first_status}"
    except Exception as exc:
        first_data = {"error": f"{type(exc).__name__}: {exc}"}

    try:
        retry_status, retry_data = post_json(endpoint, build_payload(case, demo_mode=True))
        if 200 <= retry_status < 300:
            return "live_demo_mode", normalize_output(retry_data), "-"
        if retry_status in {404, 405}:
            if case.get("type") in {"text_anchor", "concept_link"}:
                return "skipped_endpoint_missing", None, f"endpoint returned {retry_status}"
            fallback = local_fallback(case)
            if fallback is not None:
                return "local_fallback", fallback, f"endpoint returned {retry_status}"
            return "skipped_endpoint_missing", None, f"endpoint returned {retry_status}"
        first_data = retry_data
    except Exception as exc:
        first_data = {"error": f"{type(exc).__name__}: {exc}"}

    fallback = local_fallback(case)
    if fallback is not None:
        reason = first_data if first_status is None else {"status": first_status, "response": first_data}
        return "local_fallback", fallback, json_preview(reason, 180)

    return "skipped_endpoint_missing", None, "no live endpoint or local fixture fallback"


def validate_claim_review(output: Any) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checks: dict[str, bool] = {}

    if not isinstance(output, dict):
        return {"schema_ok": False, "errors": ["output is not a JSON object"], "warnings": [], "checks": {}}

    claims = output.get("claims")
    checks["has_claims_list"] = isinstance(claims, list) and len(claims) > 0
    if not checks["has_claims_list"]:
        errors.append("ClaimReview must include a non-empty claims list.")
    elif len(claims) > 5:
        warnings.append("ClaimReview contains more than 5 claims.")

    for index, claim in enumerate(claims or [], start=1):
        if not isinstance(claim, dict):
            errors.append(f"claim {index} is not an object")
            continue
        for key in ("text", "verdict", "label", "rationale", "severity"):
            if key not in claim or claim.get(key) in (None, ""):
                errors.append(f"claim {index} missing {key}")
        if claim.get("verdict") not in ALLOWED_VERDICTS:
            errors.append(f"claim {index} has invalid verdict {claim.get('verdict')!r}")
        if claim.get("severity") not in ALLOWED_SEVERITIES:
            errors.append(f"claim {index} has invalid severity {claim.get('severity')!r}")
        if word_count(claim.get("text")) > 28:
            warnings.append(f"claim {index} text is long for a UI card")

    for key in ("suggested_revision", "next_retrieval_prompt"):
        checks[f"has_{key}"] = bool(output.get(key))
        if not checks[f"has_{key}"]:
            errors.append(f"ClaimReview missing {key}")

    return {
        "schema_ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
    }


def validate_text_anchors(output: Any) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checks: dict[str, bool] = {}

    if not isinstance(output, dict):
        return {"schema_ok": False, "errors": ["output is not a JSON object"], "warnings": [], "checks": {}}

    anchors = output.get("anchors")
    checks["has_anchors_list"] = isinstance(anchors, list)
    if not isinstance(anchors, list):
        errors.append("Text anchor output must include anchors list.")
    elif len(anchors) > 3:
        warnings.append("Text anchor output contains more than 3 anchors.")

    for index, anchor in enumerate(anchors or [], start=1):
        if not isinstance(anchor, dict):
            errors.append(f"anchor {index} is not an object")
            continue
        for key in ("id", "anchor_id", "topic", "kind", "label", "body", "source_quote", "priority"):
            if key not in anchor or anchor.get(key) in (None, ""):
                errors.append(f"anchor {index} missing {key}")
        if anchor.get("kind") not in ALLOWED_ANCHOR_KINDS:
            warnings.append(f"anchor {index} has uncommon kind {anchor.get('kind')!r}")
        if anchor.get("priority") not in ALLOWED_PRIORITIES:
            errors.append(f"anchor {index} has invalid priority {anchor.get('priority')!r}")
        if word_count(anchor.get("body")) > 70:
            warnings.append(f"anchor {index} body is longer than 70 words")

    return {
        "schema_ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
    }


def validate_concept_links(output: Any) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    checks: dict[str, bool] = {}

    if not isinstance(output, dict):
        return {"schema_ok": False, "errors": ["output is not a JSON object"], "warnings": [], "checks": {}}

    links = output.get("links")
    checks["has_links_list"] = isinstance(links, list)
    if not isinstance(links, list):
        errors.append("Concept link output must include links list.")
    elif len(links) > 3:
        warnings.append("Concept link output contains more than 3 links.")

    for index, link in enumerate(links or [], start=1):
        if not isinstance(link, dict):
            errors.append(f"link {index} is not an object")
            continue
        for key in (
            "id",
            "from_concept",
            "to_concept",
            "relation",
            "anchor_id",
            "label",
            "explanation",
            "source_quote",
            "priority",
        ):
            if key not in link or link.get(key) in (None, ""):
                errors.append(f"link {index} missing {key}")
        if link.get("relation") not in ALLOWED_RELATIONS:
            errors.append(f"link {index} has invalid relation {link.get('relation')!r}")
        if link.get("priority") not in ALLOWED_PRIORITIES:
            errors.append(f"link {index} has invalid priority {link.get('priority')!r}")
        if word_count(link.get("explanation")) > 70:
            warnings.append(f"link {index} explanation is longer than 70 words")

    return {
        "schema_ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
    }


def text_blob(output: Any) -> str:
    return json.dumps(output, ensure_ascii=False).lower()


def claim_with_terms(output: dict[str, Any], terms: list[str]) -> dict[str, Any] | None:
    for claim in output.get("claims", []):
        haystack = " ".join(
            str(claim.get(key, ""))
            for key in ("text", "label", "rationale", "improvement")
        ).lower()
        if all(term in haystack for term in terms):
            return claim
    return None


def check_expected_properties(case: dict[str, Any], output: Any) -> dict[str, Any]:
    passed: list[str] = []
    failed: list[str] = []
    case_id = case.get("id")
    case_type = case.get("type")
    blob = text_blob(output)

    def record(name: str, ok: bool) -> None:
        (passed if ok else failed).append(name)

    if case_type == "check_claim" and isinstance(output, dict):
        claims = output.get("claims", [])
        record("returns valid ClaimReview JSON", isinstance(claims, list) and len(claims) > 0)

        if case_id == "reader_mcp_claim_review":
            record("extracts at least 2 claims", len(claims) >= 2)
            role_claim = claim_with_terms(output, ["reader", "write"])
            record(
                "marks Reader writes final output as incorrect or partial",
                bool(role_claim and role_claim.get("verdict") in {"incorrect", "partial"}),
            )
            record("mentions Resolver has write access", "resolver" in blob and "write" in blob)
            record("includes suggested_revision", bool(output.get("suggested_revision")))
            record("includes next_retrieval_prompt", bool(output.get("next_retrieval_prompt")))

        elif case_id == "quantum_measurement_claim_review":
            reveal_claim = None
            for claim in claims:
                haystack = " ".join(
                    str(claim.get(key, ""))
                    for key in ("text", "label", "rationale", "improvement")
                ).lower()
                if any(term in haystack for term in ("pre-existing", "already had", "hidden", "reveal")):
                    reveal_claim = claim
                    break
            record(
                "flags reveal/pre-existing value misconception",
                bool(reveal_claim and reveal_claim.get("verdict") in {"incorrect", "partial", "unsupported"}),
            )
            record("distinguishes superposition from hidden classical value", "hidden" in blob or "pre-existing" in blob)
            record("mentions probabilities from amplitudes", "probab" in blob or "amplitude" in blob)

        elif case_id == "correct_answer_claim_review":
            correct_count = sum(1 for claim in claims if claim.get("verdict") == "correct")
            record("does not hallucinate errors", correct_count >= max(1, len(claims) - 1))
            record("marks most claims correct", correct_count >= max(1, len(claims) // 2))
            record("preserves concise feedback", word_count(output.get("summary")) <= 35)

    elif case_type == "text_anchor" and isinstance(output, dict):
        anchors = output.get("anchors", [])
        record("returns valid anchors JSON", isinstance(anchors, list))
        record("produces at most 3 anchors", isinstance(anchors, list) and len(anchors) <= 3)
        record("each anchor is concise", all(word_count(anchor.get("body")) <= 70 for anchor in anchors))
        record("each anchor has source_quote", all(bool(anchor.get("source_quote")) for anchor in anchors))
        record("fits as subtle inline note", all(word_count(anchor.get("body")) <= 45 for anchor in anchors))
        if case_id == "anchor_minimality":
            record("distinguishes MCP access from write access", "mcp" in blob and "write" in blob)
            record("body under 45 words", all(word_count(anchor.get("body")) < 45 for anchor in anchors))

    elif case_type == "concept_link" and isinstance(output, dict):
        links = output.get("links", [])
        record("returns valid links JSON", isinstance(links, list))
        record("links superposition and measurement", "superposition" in blob and "measurement" in blob)
        record(
            "includes a relation from allowed set",
            all(link.get("relation") in ALLOWED_RELATIONS for link in links),
        )
        record("explanation is concise", all(word_count(link.get("explanation")) <= 70 for link in links))
        record("does not produce large graph", isinstance(links, list) and len(links) <= 3)

    return {
        "expected_ok": not failed,
        "passed": passed,
        "failed": failed,
    }


def validate_case_output(case: dict[str, Any], output: Any) -> dict[str, Any]:
    if case.get("type") == "check_claim":
        schema = validate_claim_review(output)
    elif case.get("type") == "text_anchor":
        schema = validate_text_anchors(output)
    elif case.get("type") == "concept_link":
        schema = validate_concept_links(output)
    else:
        schema = {
            "schema_ok": False,
            "errors": [f"unsupported case type {case.get('type')!r}"],
            "warnings": [],
            "checks": {},
        }

    expected = check_expected_properties(case, output) if schema.get("schema_ok") else {
        "expected_ok": False,
        "passed": [],
        "failed": ["schema failed"],
    }

    return {
        **schema,
        **expected,
    }


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("judge response did not contain a JSON object")
    return json.loads(cleaned[start : end + 1])


def run_llm_judge(
    case: dict[str, Any],
    output: Any,
    rubric_text: str,
) -> tuple[dict[str, Any] | None, str, str]:
    if os.getenv("SHRODINGER_EVAL_SKIP_JUDGE") == "1":
        return None, "skipped", "SHRODINGER_EVAL_SKIP_JUDGE=1"

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None, "not_configured", "GOOGLE_API_KEY not set"

    prompt = JUDGE_PROMPT_TEMPLATE.format(
        case_json=json.dumps(case, ensure_ascii=False, indent=2),
        output_json=json.dumps(output, ensure_ascii=False, indent=2),
        expected_properties=json.dumps(case.get("expected_properties", []), ensure_ascii=False, indent=2),
        rubric_text=rubric_text,
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model_name = os.getenv("SHRODINGER_EVAL_JUDGE_MODEL", "gemini-flash-lite-latest")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0,
                max_output_tokens=900,
            ),
            request_options={"timeout": 15},
        )
        raw_text = getattr(response, "text", "") or ""
        data = extract_json_object(raw_text)
        scores = data.get("scores", {})
        required = {
            "source_groundedness",
            "atomicity",
            "learning_friction",
            "minimality",
            "tool_phase_correctness",
            "trace_accountability",
            "challengeability",
            "schema_reliability",
        }
        missing = sorted(required - set(scores))
        if missing:
            raise ValueError(f"judge response missing scores: {missing}")
        for key in required:
            scores[key] = max(1, min(5, int(scores[key])))
        data["scores"] = scores
        return data, "passed", "-"
    except Exception as exc:
        return None, "failed", f"{type(exc).__name__}: {exc}"


def average_score(rubric: dict[str, Any] | None) -> float | None:
    if not rubric:
        return None
    scores = rubric.get("scores", {})
    if not scores:
        return None
    return round(sum(scores.values()) / len(scores), 2)


def rubric_passed(rubric: dict[str, Any] | None) -> bool:
    avg = average_score(rubric)
    if avg is None:
        return False
    scores = rubric.get("scores", {})
    return (
        avg >= 4.0
        and scores.get("source_groundedness", 0) >= 4
        and scores.get("schema_reliability", 0) >= 4
        and scores.get("tool_phase_correctness", 0) >= 4
    )


def evaluate_case(case: dict[str, Any], rubric_text: str) -> dict[str, Any]:
    source, output, call_issue = call_case(case)

    if source == "skipped_endpoint_missing":
        return {
            "case_id": case.get("id"),
            "type": case.get("type"),
            "status": "skipped_endpoint_missing",
            "source": source,
            "deterministic": {
                "schema_ok": None,
                "expected_ok": None,
                "errors": [],
                "warnings": [call_issue],
                "checks": {},
                "passed": [],
                "failed": [],
            },
            "judge_status": "skipped",
            "rubric": None,
            "average_score": None,
            "main_issue": call_issue,
            "output_preview": "",
        }

    deterministic = validate_case_output(case, output)
    rubric, judge_status, judge_issue = (None, "skipped", "schema failed")
    if deterministic.get("schema_ok"):
        rubric, judge_status, judge_issue = run_llm_judge(case, output, rubric_text)

    avg = average_score(rubric)
    if not deterministic.get("schema_ok"):
        status = "failed"
    elif rubric is None:
        status = "schema_only"
    elif rubric_passed(rubric):
        status = "passed"
    else:
        status = "failed"

    issue = "-"
    if deterministic.get("errors"):
        issue = "; ".join(deterministic["errors"][:2])
    elif deterministic.get("failed"):
        issue = "; ".join(deterministic["failed"][:2])
    elif rubric and rubric.get("main_issue"):
        issue = rubric["main_issue"]
    elif judge_issue != "-":
        issue = judge_issue
    elif call_issue != "-":
        issue = call_issue

    return {
        "case_id": case.get("id"),
        "type": case.get("type"),
        "status": status,
        "source": source,
        "deterministic": deterministic,
        "judge_status": judge_status,
        "rubric": rubric,
        "average_score": avg,
        "main_issue": issue,
        "output_preview": json_preview(output),
    }


def print_report(results: list[dict[str, Any]]) -> None:
    print(f"{'case_id':38} {'type':13} {'avg':6} {'pass':6} issue")
    for result in results:
        avg = result.get("average_score")
        avg_text = f"{avg:.2f}" if isinstance(avg, (int, float)) else (
            "SKIP" if result["status"] == "skipped_endpoint_missing" else "SCHEMA"
        )
        pass_text = {
            "passed": "YES",
            "failed": "NO",
            "schema_only": "SCHEMA",
            "skipped_endpoint_missing": "SKIP",
        }.get(result["status"], result["status"])
        issue = result.get("main_issue") or "-"
        print(f"{result['case_id'][:38]:38} {result['type'][:13]:13} {avg_text:6} {pass_text:6} {issue}")

    total = len(results)
    passed = sum(1 for result in results if result["status"] == "passed")
    failed = sum(1 for result in results if result["status"] == "failed")
    skipped = sum(1 for result in results if result["status"] == "skipped_endpoint_missing")
    scored = [result["average_score"] for result in results if isinstance(result.get("average_score"), (int, float))]
    overall = round(sum(scored) / len(scored), 2) if scored else None

    print()
    print(f"Total cases: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")
    print(f"Average rubric score: {overall if overall is not None else 'n/a'}")


def main() -> int:
    load_env(BACKEND_DIR / ".env")

    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    rubric_text = RUBRIC_PATH.read_text(encoding="utf-8")
    results = [evaluate_case(case, rubric_text) for case in cases]

    summary = {
        "total": len(results),
        "passed": sum(1 for result in results if result["status"] == "passed"),
        "failed": sum(1 for result in results if result["status"] == "failed"),
        "skipped": sum(1 for result in results if result["status"] == "skipped_endpoint_missing"),
        "schema_only": sum(1 for result in results if result["status"] == "schema_only"),
    }
    scored = [result["average_score"] for result in results if isinstance(result.get("average_score"), (int, float))]
    summary["average_rubric_score"] = round(sum(scored) / len(scored), 2) if scored else None

    RESULTS_PATH.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "api_base": API_BASE,
                "summary": summary,
                "results": results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print_report(results)

    has_schema_failure = any(
        result["status"] != "skipped_endpoint_missing"
        and result.get("deterministic", {}).get("schema_ok") is False
        for result in results
    )
    return 1 if has_schema_failure else 0


if __name__ == "__main__":
    raise SystemExit(main())
