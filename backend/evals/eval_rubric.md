# Shrodinger Rubric Eval

Score each dimension 1-5.

## 1. Source-groundedness

5: Every intervention or claim verdict is clearly grounded in the provided source context.

3: Mostly grounded, but some generic or weakly supported claims appear.

1: Gives advice/explanations not supported by the source.

## 2. Atomicity / structural clarity

5: Splits student answer or augmentation into short, independent, UI-ready units.

3: Mostly clear but merges some claim/reason/consequence.

1: Broad free-form feedback or bloated text.

## 3. Learning friction quality

5: Forces learner to explain, distinguish, apply, revise, or retrieve.

3: Some active learning, but partly spoon-feeds the answer.

1: Mostly gives a summary or final answer.

## 4. Minimality / document fit

5: Concise enough to be embedded inside the document without visual bloat.

3: Useful but too long or visually heavy.

1: Too long; would dominate the document.

## 5. Tool / phase correctness

5: Correct behavior for phase: anchors and links at planning time, claim review at checkpoint time, transcription only for voice input.

3: Mostly correct but phase/tool confusion.

1: Wrong tool or wrong moment.

## 6. Trace / accountability

5: Mistakes, corrections, challenges, source basis, and recall prompts can become traceable learning objects.

3: Feedback exists but trace implications are incomplete.

1: Correction overwrites the mistake; no accountability.

## 7. Challengeability

5: AI judgment includes rationale/source basis and can be challenged.

3: Some rationale but not enough to debate.

1: AI acts as oracle.

## 8. Schema reliability

5: Output always matches expected schema and is parseable.

3: Mostly parseable but missing optional useful fields.

1: Free-form or malformed output.

## Automatic fail conditions

- Output gives the full answer before the learner attempts one.
- Output is a generic summary.
- Output is not grounded in the source.
- Output is too long to render as a subtle document intervention.
- Corrected mistake disappears rather than being preserved in trace.
- Endpoint/tool returns malformed JSON.

## Pass rule

- Average score >= 4.0
- source_groundedness >= 4
- schema_reliability >= 4
- tool_phase_correctness >= 4
