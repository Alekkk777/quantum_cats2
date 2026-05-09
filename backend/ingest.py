import json
import re
import os

def elabora_documento(file_markdown_path):
    print("🚀 Inizio ingestione documento...")
    
    with open(file_markdown_path, "r", encoding="utf-8") as f:
        testo_completo = f.read()

    # 1. CHUNKING SEMANTICO: Dividiamo il testo basandoci sui titoli Markdown (## o ###)
    # Questo espressione regolare taglia il testo ogni volta che trova un nuovo titolo
    sezioni_grezze = re.split(r'\n(?=#{2,3} )', testo_completo)
    
    database_vettoriale_simulato = {}
    
    for i, blocco in enumerate(sezioni_grezze):
        if not blocco.strip():
            continue
            
        # Generiamo un ID univoco per il blocco (es. "sezione_1")
        sezione_id = f"sezione_{i+1}"
        
        # 2. VETTORIZZAZIONE (Per l'Hackathon: Salviamo semplicemente il chunk pulito)
        # Se volete usare i veri vettori di Gemini, qui chiamereste:
        # embedding = genai.embed_content(model="models/text-embedding-004", content=blocco)
        
        database_vettoriale_simulato[sezione_id] = blocco.strip()
        print(f"✅ Ingerito chunk {sezione_id}: {blocco[:50]}...")

    # 3. SALVATAGGIO NEL "VECTOR DB" LOCALE
    os.makedirs("data", exist_ok=True)
    with open("data/source_chunks.json", "w", encoding="utf-8") as f:
        json.dump(database_vettoriale_simulato, f, indent=2)
        
    print("🎉 Ingestione completata! DB locale pronto per l'Orchestratore.")

# Esempio d'uso: 
# Crea un file finto "capitolo1.md" e poi esegui questo script.
if __name__ == "__main__":
    # Assicurati di avere un file .md di test per provare
    elabora_documento("capitolo1.md")