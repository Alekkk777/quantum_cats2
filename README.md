# ◐ Shrodinger
**The document is the interface. Overcoming Eduslop via Productive Friction.**

[![Built for: GDG AI HACK 2026](https://img.shields.io/badge/GDG_AI_HACK-2026-blue)](https://#)
[![Track: Braynr EdTech](https://img.shields.io/badge/Track-Braynr_EdTech-purple)](https://#)
[![Team: Quantum Cats](https://img.shields.io/badge/Team-Quantum_Cats-black)](https://#)

## 🚨 The Cognitive Crisis: "Eduslop"
Most AI study tools today are chat-driven. Students ask for a summary, the AI generates it, and the student reads it. This leads to **Cognitive Offloading**: the AI does the thinking, and the student learns nothing. 

**Shrodinger** inverts this paradigm. We don't use AI to generate content for the student; we use AI to generate *friction* for the student.

## 🧠 The Solution: Productive Friction & Scaffolding
Shrodinger is a **Source-Driven** learning architecture. There is no chatbot sidebar. The document itself is the interface. 

As the user reads, a Multi-Agent Swarm analyzes their cognitive trace and dynamically injects interventions (cloze tests, expandable metaphors, challenges) directly into the text. It maps perfectly to the **PACRAR** study method, enforcing active retrieval (The Testing Effect) instead of passive recognition.

## 🏗️ Technical Architecture
We explicitly rejected heavy, black-box frameworks in favor of a fast, deterministic, and highly observable stack.

### 1. Frontend: The "Living Document"
* **Tech:** React, Vite, TailwindCSS, Tiptap (ProseMirror).
* **How it works:** Tiptap parses the markdown source into an Abstract Syntax Tree (AST). Instead of rendering static text, we use custom `Node Views` to inject interactive React components (`<ClozeTest />`, `<InlineChallenge />`) exactly at the targeted coordinates.

### 2. Backend API & Dual Vector Tracing
* **Tech:** Python, FastAPI.
* **How it works:** An asynchronous API gateway that manages our **Dual Vector DBs**:
  1. `Source Vector DB`: The embedded chunks of the study material.
  2. `User Vector DB`: The student's knowledge graph.
  *FastAPI calculates the cosine similarity between the text and the user in real-time to trigger the exact right level of scaffolding.*

### 3. AI Orchestration: The Swarm & Rubrics
* **Tech:** LangChain, Pydantic, LLM-as-a-Judge.
* **How it works:** LangChain orchestrates a swarm of three agents: **Inquisitor** (friction), **Mentor** (scaffolding), and **Explorer** (context). 
* **Strict Outputs:** Every LLM call is constrained by **Pydantic** to guarantee a valid JSON schema. 
* **Rubric Evaluation:** We don't use LLMs to say "Good job!". We use them as judges against a strict Rubric to evaluate *outcomes* (concepts, vocabulary, logic), updating the `user_brain.json` deterministically.

### 4. Auditory Scaffolding
* **Tech:** ElevenLabs API.
* **How it works:** Fast, low-latency streaming of high-fidelity synthetic voice to provide auditory hints and metacognitive feedback without breaking visual immersion.

---

## ⚙️ Quickstart (Running locally for Judges)

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* OpenAI / Gemini API Key
* ElevenLabs API Key

### 1. Clone & Install
```bash
git clone [https://github.com/your-org/shrodinger.git](https://github.com/your-org/shrodinger.git)
cd shrodinger