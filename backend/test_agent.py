import json
from make_questions_mcp import generate_question, check_claim

context = """
The Reader tier touches untrusted documents. It has Read and Grep only.
It has no MCP access, no write tools, and no bash.
The Orchestrator never touches untrusted documents directly and has MCP access
to trusted internal systems.
The Resolver is the only tier with write access.
"""

question = generate_question.invoke({
    "topic": "Reader tier and MCP access",
    "context": context,
})

print("\nQUESTION:")
print(question)

answer = (
    "The Reader must not have MCP access because it writes the final output, "
    "so it could leak data."
)

raw_review = check_claim.invoke({
    "question": question,
    "answer": answer,
    "context": context,
})

print("\nRAW REVIEW:")
print(raw_review)

data = json.loads(raw_review)
print("\nPARSED OK")
print("Claims:", len(data["claims"]))
for claim in data["claims"]:
    print("-", claim["label"], "|", claim["text"])