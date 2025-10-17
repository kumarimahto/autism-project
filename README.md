# AI-Assisted Autism Screening & Therapy Recommendation Prototype

This repository contains a minimal prototype (frontend + backend) for the college project brief.

Structure:
- `backend_node/` — Node.js Express backend that queries an AI model (OpenAI) to generate therapy goals and activities. Includes a deterministic fallback when an API key isn't configured.
- `frontend/` — Vite + React single-page app with a simple form, result view, PDF download and local storage.

Security note: Do NOT commit API keys. Use environment variables (see `backend/.env.example`).

Next steps:
1. Configure backend: copy `backend_node/.env.example` (or create `.env`) and set `OPENAI_API_KEY` if available.
2. Install backend deps and run (Node):

```bash
cd backend_node
npm install
node server.js
```

3. Install frontend deps and run:

```bash
cd frontend
npm install
npm run dev
```
