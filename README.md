# VedaAI – AI Assessment Creator

An AI-powered question paper generator for teachers, built with Next.js, Express, MongoDB, Redis, BullMQ, and Claude AI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Dashboard (public) → Create Form → Question Paper View      │
│  Zustand state · Supabase auth · WebSocket client            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (Express + TS)                     │
│  REST API  ─►  BullMQ Queue  ─►  Worker  ─►  Claude API     │
│  MongoDB (assignments + papers)                              │
│  Redis (job state + caching)                                 │
│  WebSocket (real-time progress updates)                      │
└─────────────────────────────────────────────────────────────┘
```

### Generation Flow
1. Frontend POSTs form data → `POST /api/assignments`
2. Backend creates MongoDB document + BullMQ job
3. Worker picks up job → calls Claude API (claude-haiku)
4. Claude returns structured JSON question paper
5. Paper is parsed, validated, stored in MongoDB
6. WebSocket notifies frontend → page auto-navigates to paper view

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand |
| Auth | Supabase (email/password) |
| Real-time | WebSocket (native browser + `ws` server) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Cache / Jobs | Redis + BullMQ |
| AI | Anthropic Claude (claude-haiku-4-5) |
| PDF Export | html2canvas + jsPDF |

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Anthropic API key
- Supabase project

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** — copy `.env` and fill in:
```env
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_HOST=localhost
REDIS_PORT=6379
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

### 3. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Enable Email auth (Authentication → Providers → Email)
3. Copy URL + anon key to `.env.local`

### 4. Run

```bash
# Terminal 1: Backend API server
cd backend
npm run dev

# Terminal 2: Background worker
cd backend
npm run worker

# Terminal 3: Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

- **Public Dashboard** — browse recent assignments without login
- **Supabase Auth** — sign up / sign in required only to create assignments
- **Assignment Form** — title, subject, topic, grade, due date, 5 question types with configurable counts + marks, optional file upload
- **AI Generation** — Claude converts form input → structured JSON question paper with sections, questions, difficulty tags, marks
- **Real-time Progress** — WebSocket updates show generation progress (0–100%)
- **Question Paper View** — exam-style layout with student info section, sectioned questions, difficulty badges
- **PDF Export** — downloads formatted A4 PDF using html2canvas + jsPDF
- **Regenerate** — one-click regeneration with confirmation

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| POST | `/api/assignments` | Create assignment + queue job |
| GET | `/api/assignments?userId=` | List user assignments |
| GET | `/api/assignments/:id` | Get assignment by ID |
| GET | `/api/assignments/:id/paper` | Get generated question paper |
| POST | `/api/assignments/:id/regenerate` | Regenerate question paper |
| WS | `/ws?userId=` | WebSocket connection |
