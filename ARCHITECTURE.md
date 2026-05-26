# VedaAI — Architecture Overview

## What It Is

VedaAI is an AI-powered assessment creator for teachers. A teacher describes what they want (subject, grade, question types), uploads optional reference material, and the system generates a print-ready question paper using a large language model. The paper can be downloaded as a PDF, organised into groups, or used as a library of reusable assessments.

---

## System Topology

```
Browser (Next.js)
  │
  ├── HTTPS  ──►  Express API  (Node.js)
  │                  │
  │                  ├── MongoDB Atlas   (persistent store)
  │                  ├── Upstash Redis   (cache + BullMQ queue)
  │                  └── Groq API        (LLM inference)
  │
  └── WebSocket ──►  WS Server  (same Express process)
                         │
                         └── BullMQ Worker  (separate process)
                                 │
                                 └── Groq API
```

The API server and WebSocket server share one `http.Server` instance. The BullMQ worker runs as a **separate Node process** (`workers/generationWorker.ts`) so long AI jobs never block HTTP request handling.

---

## Frontend Architecture

**Framework:** Next.js 14 App Router, deployed on Vercel (or any static/SSR host).

### Page Map

| Route | Purpose |
|---|---|
| `/` | Dashboard — recent assignments, quick stats |
| `/create` | Multi-step form to submit a new assignment |
| `/assignments` | List view; `?paper=ID` switches to paper viewer |
| `/assignment/[id]` | Real-time job status page (WebSocket listener) |
| `/groups` | Manage class groups; AI insights per group |
| `/library` | Completed papers saved for reuse |
| `/toolkit/lesson-planner` | Chat-style lesson plan generator |
| `/toolkit/rubric-builder` | Chat-style rubric generator |
| `/toolkit/question-generator` | Chat-style question set generator |
| `/settings` | School name, profile, notification management |

### State Management (Zustand + localStorage)

| Store | What it holds | Persisted |
|---|---|---|
| `useAuthStore` | Supabase user, school name | No |
| `useAssignmentStore` | Assignment list, job statuses | No |
| `useNotificationStore` | Bell notifications (max 50) | Yes |
| `useToolkitHistoryStore` | Toolkit generation history (max 100) | Yes |

### Key Frontend Patterns

- **AppLayout** — single wrapper that renders Sidebar + Topbar on desktop, MobileNavbar + MobileBottomBar on mobile. Every page composes inside it. The `activeTab` prop drives the topbar icon and controls whether the back button is shown (`showBack`).
- **Suspense boundaries** — every page that reads `useSearchParams()` is wrapped in `<Suspense>` to satisfy Next.js App Router's server/client split.
- **PDF generation** — html2canvas + jsPDF, entirely client-side. The paper element is cloned into an off-screen 794 px container before capture to avoid scroll/overflow artefacts.
- **ToolkitChat** — reusable conversational form component. Left panel drives a step-by-step question sequence; right panel shows the AI result with a "VedaAI is thinking…" animation during inference. History is persisted per tool key.

---

## Backend Architecture

**Framework:** Express on Node.js, TypeScript, compiled with `tsc`.

### Route Structure

```
POST /api/assignments          Create assignment + enqueue job
GET  /api/assignments          List by userId (Redis-cached 30s)
GET  /api/assignments/:id      Single assignment
GET  /api/assignments/:id/paper  Question paper (Redis-cached 5 min)
POST /api/assignments/:id/regenerate  Re-queue generation
DELETE /api/assignments/:id    Delete + purge cache + delete file

GET  /api/groups               List groups with counts (aggregation)
POST /api/groups               Create group
GET  /api/groups/:id/assignments  Assignments in group
POST /api/groups/:id/insights  AI analysis of group
DELETE /api/groups/:id         Delete group

POST /api/toolkit/lesson-plan  Generate lesson plan (Groq)
POST /api/toolkit/rubric       Generate rubric (Groq)
POST /api/toolkit/questions    Generate question set (Groq)

GET  /health                   MongoDB + Redis liveness probe
```

### Async Job Pipeline

```
POST /api/assignments
  └─► Assignment.create({ status: 'pending' })
  └─► BullMQ.add('generate', payload)
  └─► return { assignmentId, jobId }

BullMQ Worker (separate process)
  └─► Assignment.status = 'processing'
  └─► WS notify: job_processing (10%)
  └─► Groq.chat.completions (≤45s timeout)
  └─► QuestionPaper.create(parsedResult)
  └─► Assignment.status = 'completed'
  └─► WS notify: job_completed → frontend adds notification
```

The worker retries failed jobs up to 3 times with exponential backoff (2 s base). Completed jobs are kept for 100 entries; failed jobs for 50.

### Caching Strategy

| Key pattern | TTL | Invalidated on |
|---|---|---|
| `assignments:{userId}` | 30 s | Assignment created or deleted |
| `paper:{assignmentId}` | 5 min | Assignment deleted or regenerated |

### AI Integration

All LLM calls go through Groq (`llama-3.3-70b-versatile` by default, overridable via `GROQ_MODEL` env var). Every call is wrapped in `withTimeout()` (default 45 s, overridable via `GROQ_TIMEOUT_MS`). All endpoints request `response_format: { type: 'json_object' }` to guarantee parseable output.

### Database Indexes

| Collection | Index |
|---|---|
| `assignments` | `userId` · `groupId` · `{userId,createdAt}` · `{userId,status}` |
| `questionpapers` | `assignmentId` (unique lookup) · `userId` |
| `groups` | `userId` |

---

## Data Models

```
Assignment
  title, subject, topic, gradeLevel
  dueDate, questionTypes[], additionalInstructions
  filePath, fileContent          ← uploaded reference doc
  userId, groupId, jobId
  status: pending|processing|completed|failed
  timestamps

QuestionPaper
  assignmentId, userId
  title, subject, topic, gradeLevel
  totalMarks, duration
  sections[] → questions[] → options[]
  generatedAt, timestamps

Group
  name, subject, grade, description
  userId
  timestamps
  (assignmentCount, completedCount, pendingCount computed at query time)
```

---

## Authentication

Supabase handles auth (Google OAuth). The frontend stores the Supabase session in `useAuthStore`. The backend currently trusts `userId` from the request body/query — **production hardening should add JWT verification middleware** that validates the Supabase access token on every route.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Upstash Redis URL |
| `GROQ_API_KEY` | Groq inference key |
| `FRONTEND_URL` | CORS allow-origin |
| `PORT` | HTTP port (default 5000) |
| `GROQ_MODEL` | LLM model name (default `llama-3.3-70b-versatile`) |
| `GROQ_TIMEOUT_MS` | AI call timeout in ms (default 45000) |
| `WORKER_CONCURRENCY` | BullMQ worker concurrency (default 3) |

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend HTTP base URL |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | SSR + static hybrid, file-based routing |
| UI styling | Tailwind CSS | Rapid iteration, consistent design tokens |
| State | Zustand + persist | Minimal boilerplate, localStorage sync built-in |
| Auth | Supabase (Google OAuth) | Zero-config social login, free tier |
| Backend | Express + TypeScript | Familiar, lightweight, easy to extend |
| Database | MongoDB Atlas | Flexible schema, free tier, managed |
| Cache / Queue | Upstash Redis + BullMQ | Serverless-compatible Redis; BullMQ requires `maxRetriesPerRequest: null` |
| AI inference | Groq (Llama 3.3 70B) | Fastest open-model inference, JSON mode |
| Real-time | WebSocket (`ws`) | Simple push for job progress; no polling |
| File uploads | Multer | Multipart form parsing, disk storage |
| PDF export | html2canvas + jsPDF | Client-side, no server dependency |

---

## Known Pre-Production Gaps

1. **No auth middleware** — backend trusts `userId` from the client. Add Supabase JWT verification before public launch.
2. **No pagination** — assignment and group lists return all records. Add `?page=&limit=` before user counts grow.
3. **No rate limiting** — toolkit and insights routes call Groq on every request. Add `express-rate-limit` per user.
4. **No tests** — no unit or integration tests exist. Add at minimum smoke tests for the job pipeline.
5. **Uploaded files not cleaned up on worker failure** — only the delete route removes the file; failed jobs leave orphaned uploads.
