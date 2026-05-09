from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurazione CORS (Permette a React di parlare con FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione si mette l'URL esatto, per l'hackathon va bene "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "We are Online Bro"}