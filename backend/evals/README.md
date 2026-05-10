# Shrodinger Local Evals

This is a lightweight local rubric evaluator for Shrodinger outputs. It checks whether claim reviews, text anchors, and concept links are source-grounded, structured, minimal, active-learning oriented, and trace-friendly.

It is not LangSmith, not a full benchmark, and not a formal learning-science validation. It is a demo-friendly harness for catching obvious regressions before showing the app.

## How to run

1. Start the backend:

```powershell
cd backend
.\gdg26\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

2. Run the eval:

```powershell
python evals/run_rubric_eval.py
```

You can also run it from the repo root:

```powershell
python backend/evals/run_rubric_eval.py
```

3. Read results:

```text
backend/evals/eval_results.json
```

If `GOOGLE_API_KEY` is present, the runner attempts the rubric LLM judge. If not, it runs deterministic schema and expected-property checks only. If the app is using `GEMINI_API_KEY`, the runner will also accept that key.
