"""
Minimal starter — load metadata.json and print a summary.
Run: python starter.py
"""

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


DATA = Path(__file__).parent / 'metadata.json'


def fmt(ts: int) -> str:
    return datetime.fromtimestamp(ts / 1000, tz=timezone.utc).strftime('%Y-%m-%d %H:%M UTC')


def main() -> None:
    with open(DATA, 'r', encoding='utf-8') as f:
        backup = json.load(f)

    book = backup['books'][0]

    print('=' * 60)
    print(f"BOOK: {book['title']}")
    print('=' * 60)

    counts = {
        'keywords':  len(book.get('keywords',  [])),
        'notes':     len(book.get('notes',     [])),
        'flashcards': len(book.get('questions', [])),
        'chats':     len(book.get('chats',     [])),
        'mindmaps':  len(book.get('mindmaps',  [])),
        'headings':  len(book.get('headings',  [])),
    }
    for label, n in counts.items():
        print(f'  {label:12s} {n}')

    # All events with timestamps
    events = []
    events += [(k['createdAt'], 'keyword',   k.get('text', '')[:40])               for k in book.get('keywords',  [])]
    events += [(n['createdAt'], 'note',      n.get('title', ''))                   for n in book.get('notes',     [])]
    events += [(q['createdAt'], 'flashcard', (q.get('text') or '')[:60].replace('**', '')) for q in book.get('questions', [])]
    events += [(c['createdAt'], 'chat',      c.get('title', ''))                   for c in book.get('chats',     [])]
    events += [(m['createdAt'], 'mindmap',   'mindmap')                            for m in book.get('mindmaps',  [])]
    for q in book.get('questions', []):
        for r in q.get('results', []):
            events.append((r['time'], 'review', f"rating={r['rating']}"))
    events.sort()

    print()
    print(f'TOTAL EVENTS: {len(events)}')
    print()

    # Distribution by day
    days = Counter(fmt(e[0])[:10] for e in events)
    print('EVENTS PER DAY:')
    for day in sorted(days):
        print(f'  {day}  -  {days[day]}')

    print()
    print('FIRST 10 EVENTS:')
    for ts, kind, label in events[:10]:
        print(f'  {fmt(ts)}  {kind:9s}  {label}')

    print()
    print('FLASHCARD REVIEW SUMMARY:')
    rating_label = {1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy'}
    for q in book.get('questions', []):
        text = (q.get('text') or '').replace('**', '')[:65]
        ratings = [rating_label[r['rating']] for r in q.get('results', [])]
        card = q.get('Card', {})
        print(f"  diff={card.get('difficulty', 0):4.1f}  stab={card.get('stability', 0):5.1f}d  "
              f"reviews={ratings}  |  {text}")

    print()
    print('CHATS:')
    for c in book.get('chats', []):
        style = c.get('writingStyleKey', 'default')
        first = (c.get('messages') or [{}])[0].get('content', '')[:80]
        print(f"  [{style}]  {c.get('title', '')}")
        print(f"    first user message: {first}...")


if __name__ == '__main__':
    main()
