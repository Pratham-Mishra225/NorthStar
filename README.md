# AI Career Advisor

A career readiness tool for students and early-career professionals. Upload your resume, choose a target role, and get an evidence-led view of how your experience aligns—with an ATS-style resume score, skill gap analysis, and curated job recommendations.

---

## Problem Statement

Job seekers—especially students—often apply blindly, with no clear signal of how their resume actually reads against a role's requirements. Generic advice ("add keywords", "tailor your resume") lacks the specificity to act on.

## Solution

AI Career Advisor gives you a structured, explainable view of your resume against a specific role. Every insight is tied back to text evidence rather than opaque ML predictions, so you can see exactly what the system found—and what it didn't.

---

## Core Features

### ATS-Style Resume Analysis
Upload a PDF, DOCX, or TXT resume. The system extracts readable text client-side (no server storage), runs it through a deterministic scoring heuristic, and returns a weighted breakdown:

| Component | Weight |
|---|---|
| Keyword coverage | 30% |
| Skill match | 25% |
| Sections present | 15% |
| Projects / experience | 15% |
| Contact information | 10% |
| Formatting signals | 5% |

> **Transparency note:** This is an ATS-style heuristic, not a proprietary vendor ATS score. It reflects observable resume signals, not actual ATS system behavior.

### Role Readiness
A weighted percentage of how many of a role's listed skills appear (with evidence) in your resume. Skills are categorised as **core**, **important**, or **additional**, each with a configured weight.

### Skill Gap Analysis
Surfaces the highest-priority skills from your target role that are not detected in your resume text, ordered by weight. Intended as a focused action list—not a complete skills inventory.

### Job Recommendation Engine
Matches you against a curated demo dataset of roles using a two-signal blend:
- **70%** weighted skill overlap (which listed skills you have vs. the role requires)
- **30%** TF-IDF/cosine text similarity (resume text vs. job description)

Each recommendation includes an explanation of *why* it was surfaced.

### Explainability
Every score ties back to resume evidence. The system shows matched keywords, matched skills, and which sections were found or missing—so you can understand and act on the result.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4 |
| Routing | Wouter |
| Data fetching | TanStack Query v5 |
| API | Express 5, Node.js 24 |
| Schema / validation | Zod |
| PDF extraction | pdfjs-dist (client-side) |
| DOCX extraction | Mammoth (client-side) |
| Charts | Recharts |
| Package manager | pnpm workspaces |

---

## Project Structure

```
/
├── artifacts/
│   ├── career-advisor/          # React frontend (@ai-career-advisor/web)
│   │   ├── src/
│   │   │   ├── App.tsx          # All pages and routing (single-file SPA)
│   │   │   ├── index.css        # Design tokens and global styles
│   │   │   ├── components/ui/   # Radix-based UI primitives
│   │   │   └── hooks/           # Shared hooks
│   │   └── public/              # Static assets (favicon, robots.txt)
│   └── api-server/              # Express API (@ai-career-advisor/api)
│       └── src/
│           ├── data/            # Curated demo dataset (roles, jobs, skills)
│           ├── routes/          # API endpoints
│           └── services/        # Career analysis and scoring logic
├── lib/
│   ├── api-client-react/        # Auto-generated TanStack Query hooks
│   ├── api-zod/                 # Zod schemas (generated from OpenAPI spec)
│   ├── api-spec/                # OpenAPI specification (source of truth)
│   └── db/                      # Future: database layer (not currently active)
├── scripts/                     # Post-install and utility scripts
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- pnpm 9+

### Install dependencies

```bash
pnpm install
```

### Start the API server

The API server runs on port 5000 by default:

```bash
PORT=5000 pnpm --filter @ai-career-advisor/api run dev:build
PORT=5000 pnpm --filter @ai-career-advisor/api run dev
```

### Start the frontend

The frontend Vite dev server runs on port 3000 by default:

```bash
pnpm --filter @ai-career-advisor/web run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Typecheck

```bash
pnpm run typecheck
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` (web) / required (API) | Server port |
| `BASE_PATH` | No | `/` | Vite base path (for hosting on a subpath) |

No API keys, database credentials, or external service accounts are required to run the demo.

---

## Demo Dataset

The application runs entirely on a curated demo dataset. There are **no live job listings**, **no real employer data**, and **no placement outcomes**.

- Job listings are hand-crafted examples representative of early-career tech roles
- The demo resume (`Maya Chen`) is a fictional student profile
- All skill scoring is deterministic and rule-based
- Resume text is processed in the browser and sent to the API only for the duration of the request — it is never persisted

Demo data is clearly labelled throughout the UI.

---

## Current Limitations

- No user authentication or account system — state lives in browser localStorage
- Resume text is not persisted — re-uploading is required to switch target roles
- Job dataset is static and curated, not a live job feed
- ATS scoring is a heuristic estimate, not a commercial ATS simulator
- No email, calendar, or application-tracking integrations

---

## Future Integrations

The following are explicitly **not implemented** and are noted here as architectural decisions for when the product scales:

| Capability | Status | Notes |
|---|---|---|
| Database persistence | Not implemented | `lib/db` contains a Drizzle + PostgreSQL scaffold; requires privacy and identity model decisions before activating |
| Live job APIs | Not implemented | Integrate a job board API (e.g. Adzuna, JSearch) to replace the demo dataset |
| LLM provider | Not implemented | Could be used to improve skill extraction or generate richer explanations |
| Authentication | Not implemented | Required before persisting any user data server-side |
| Course recommendations | Not implemented | Third-party course catalog API |
| Email / notifications | Not implemented | Reminder or weekly summary emails |
| Analytics | Not implemented | Usage analytics (privacy-compliant) |

---

## License

MIT
