import json
import re
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _leggi_testo(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            pagine = []
            for page in reader.pages:
                testo = page.extract_text()
                if testo:
                    pagine.append(testo)
            return "\n\n".join(pagine)
        except Exception as e:
            raise ValueError(f"Impossibile leggere il PDF: {e}")
    else:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()


def _chunk_testo(testo: str) -> dict:
    """Divide il testo in sezioni basandosi su titoli Markdown o paragrafi."""
    # Prova prima con titoli Markdown
    sezioni_grezze = re.split(r'\n(?=#{1,3} )', testo)

    # Se non ci sono titoli, divide ogni ~300 parole
    if len(sezioni_grezze) <= 1:
        parole = testo.split()
        chunk_size = 300
        sezioni_grezze = [
            " ".join(parole[i:i + chunk_size])
            for i in range(0, len(parole), chunk_size)
        ]

    db = {}
    idx = 1
    for blocco in sezioni_grezze:
        blocco = blocco.strip()
        if len(blocco) < 30:
            continue
        sezione_id = f"sezione_{idx}"
        db[sezione_id] = blocco
        print(f"✅ Ingerito {sezione_id}: {blocco[:60]}...")
        idx += 1

    return db


def elabora_documento(file_path: str):
    print(f"🚀 Inizio ingestione: {file_path}")

    testo_completo = _leggi_testo(file_path)

    if not testo_completo.strip():
        raise ValueError("Il documento è vuoto o non è stato possibile estrarne il testo.")

    db = _chunk_testo(testo_completo)

    if not db:
        raise ValueError("Nessuna sezione trovata nel documento.")

    os.makedirs(DATA_DIR, exist_ok=True)
    out_path = os.path.join(DATA_DIR, "source_chunks.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    print(f"🎉 Ingestione completata: {len(db)} sezioni salvate.")
    return db


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "data/sample_document.md"
    elabora_documento(path)
