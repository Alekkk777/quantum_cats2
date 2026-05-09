# `metadata.json` — Data Reference

> **Note:** using this JSON is **not mandatory** for the hackathon. It's a real backup exported from the Braynr app — one student studying one PDF over 5 days — provided as optional material in case you want to build something on top of real study activity data.

This file is everything you need if you only want to work with the JSON. It explains where the timestamps live, what each entity means, and how to walk the data.

## File shape (top level)

```json
{
  "backupVersion": "...",
  "appVersion": "...",
  "timestamp": 1778168566000,                ← when the backup was created (Unix ms)
  "account": { "email": "...", "plan": "..." },
  "books": [ { ... } ],                       ← always 1 book in this dataset
  "audios": [],
  "decks": [],
  "collections": [],
  "transcripts": [],
  "videos": []
}
```

## The book

Each book has a lot of fields, but for an analysis agent these are the ones that matter:

```
books[0]
├── title, pages, authors, ...               ← descriptive metadata
├── createdAt          (Unix ms)             ← when the student first opened the book
├── updatedAt          (Unix ms)             ← last activity on the book
├── keywords[]         ← highlighted terms
├── notes[]            ← student notes
├── questions[]        ← flashcards
├── chats[]            ← conversations with the AI
├── mindmaps[]         ← concept maps
└── headings[]         ← document table of contents
```

## Where every timestamp lives

| Path | Format | Meaning |
|---|---|---|
| `timestamp` | Unix ms (int) | when the backup was created |
| `books[].createdAt` / `updatedAt` | Unix ms (int) | book first opened / last touched |
| `books[].keywords[].createdAt` / `updatedAt` | Unix ms (int) | when a term was highlighted |
| `books[].notes[].createdAt` / `updatedAt` | Unix ms (int) | when a note was written / edited |
| `books[].questions[].createdAt` / `updatedAt` | Unix ms (int) | when the flashcard was generated / last reviewed |
| `books[].questions[].results[].time` | Unix ms (int) | **timestamp of each individual flashcard review** |
| `books[].questions[].Card.last_review` | ISO 8601 string | latest review of the card |
| `books[].questions[].Card.due` | ISO 8601 string | next scheduled review (computed by FSRS) |
| `books[].chats[].createdAt` / `updatedAt` | Unix ms (int) | when the chat was opened / last message |
| `books[].chats[].messages[].timestamp` | ISO 8601 string | **per-message timestamp** |
| `books[].mindmaps[].createdAt` / `updatedAt` | Unix ms (int) | when the mindmap was built / edited |
| `books[].headings[].createdAt` / `updatedAt` | Unix ms (int) | when the TOC was extracted (not student behavior) |

> Two formats coexist: integers in milliseconds since epoch (most fields) and ISO 8601 strings (chat messages, FSRS `due` / `last_review`). All values are UTC.

```python
from datetime import datetime, timezone
ts = 1778168566000
print(datetime.fromtimestamp(ts/1000, tz=timezone.utc))     # 2026-05-07 16:02:46+00:00

iso = "2026-05-07T15:30:04.000Z"
print(datetime.fromisoformat(iso.replace('Z','+00:00')))     # 2026-05-07 15:30:04+00:00
```

## Entities in detail

### `keywords[]`
A highlighted span on a page.
```json
{
  "text": "deny-by-default tooling",
  "pageNo": 6,                    ← 0-indexed (0 = first page)
  "createdAt": 1778232120000,
  "...": "..."
}
```

### `notes[]`
A free-text note the student wrote in their own words.
```json
{
  "title": "Subagent tiers",
  "text": "Reader has no MCP, no write access...",
  "pageNo": 5,
  "createdAt": 1778232022000,
  "updatedAt": 1778232134000
}
```

### `questions[]` (flashcards)
A Q/A pair with FSRS state and a full review log.
```json
{
  "text": "**Why must the Reader tier be denied MCP access?**",
  "answer": "The Reader is the tier that opens untrusted...",
  "pageNo": 6,
  "createdAt": 1778169602000,
  "Card": {
    "state": 2,                   ← 0 New · 1 Learning · 2 Review · 3 Relearning
    "difficulty": 7.1,            ← 1-10, higher = harder for this student
    "stability": 3.0,             ← days until predicted forgetting
    "reps": 4,                    ← total reviews
    "lapses": 0,                  ← times rated "Again" while in Review
    "due": "2026-05-12T10:14:00.000Z",
    "last_review": "2026-05-09T10:14:00.000Z"
  },
  "results": [
    { "time": 1778232660000, "rating": 1 },     ← first review: Again
    { "time": 1778349840000, "rating": 2 },     ← then: Hard
    { "time": 1778394840000, "rating": 2 },     ← still: Hard
    { "time": 1778457240000, "rating": 3 }      ← finally: Good
  ]
}
```

**Rating scale**: `1` = Again · `2` = Hard · `3` = Good · `4` = Easy

### `chats[]` (conversations with the AI)
```json
{
  "title": "test first two sections",
  "writingStyleKey": "socratic",          ← "default" or "socratic"
  "createdAt": 1778167790000,
  "messages": [
    { "role": "user",      "content": "...", "timestamp": "2026-05-07T15:30:04.000Z" },
    { "role": "assistant", "content": "...", "timestamp": "2026-05-07T15:30:34.000Z" }
  ]
}
```

`socratic` mode: the AI asks questions back instead of explaining — a strong active-recall signal.

### `mindmaps[]`
A concept map built from the material. Has `diagram` (Mermaid format) and timestamps.

### `headings[]`
Document outline, extracted automatically from the PDF — not a student action.

## Quick recipes

### Build a chronological event timeline
```python
import json
from datetime import datetime, timezone

with open('metadata.json') as f:
    book = json.load(f)['books'][0]

events = []
events += [(k['createdAt'], 'keyword',   k['text'])              for k in book['keywords']]
events += [(n['createdAt'], 'note',      n['title'])             for n in book['notes']]
events += [(q['createdAt'], 'flashcard', q['text'][:50])         for q in book['questions']]
events += [(c['createdAt'], 'chat',      c['title'])             for c in book['chats']]
for q in book['questions']:
    for r in q['results']:
        events.append((r['time'], 'review', f"rating={r['rating']}"))
events.sort()

for ts, kind, label in events:
    when = datetime.fromtimestamp(ts/1000, tz=timezone.utc)
    print(when.strftime('%Y-%m-%d %H:%M'), kind, label)
```

### Find weak topics (cards the student keeps failing)
```python
weak = [q for q in book['questions']
        if any(r['rating'] == 1 for r in q['results'])
           or q['Card']['difficulty'] > 6]
```

### Detect a passive chat (asking for a summary instead of reading)
```python
import re
pattern = re.compile(r"summary|don't have time|explain everything", re.I)
passive = [c for c in book['chats']
           if c['messages'] and pattern.search(c['messages'][0]['content'])]
```

### Detect days with no activity (gaps)
```python
from collections import defaultdict
days = defaultdict(int)
for ts, *_ in events:
    day = datetime.fromtimestamp(ts/1000, tz=timezone.utc).date()
    days[day] += 1
# any calendar day between min(days) and max(days) not in `days` is a gap
```
