# AI Career Advisor

A career readiness and resume alignment platform designed for students and early-career professionals. Upload a resume, select a target tech role, and receive explainable, evidence-backed evaluation—including an ATS-style heuristic score, prioritized skill gap analysis, and hybrid TF-IDF job recommendations.

---

## Overview

Job applicants frequently submit resumes without clear visibility into how well their experience matches target job descriptions. **AI Career Advisor** addresses this by providing deterministic, transparent analysis that maps specific text evidence to role requirements, eliminating opaque "black-box" scoring.

---

## Problem Statement

- **Opaque Scoring**: Commercial ATS simulators often generate arbitrary percentages without actionable evidence.
- **Blind Applications**: Students often apply to roles without knowing which core competencies are missing from their resumes.
- **Lack of Persistent State**: Early-stage tools lose user history, saved opportunities, and analytics when sessions refresh.

---

## Solution

AI Career Advisor delivers an explainable, persistent career evaluation platform:
1. **Client-Side Text Extraction**: Resumes are parsed directly in the browser (via PDF.js and Mammoth.js) and analyzed against transparent criteria.
2. **Deterministic Evaluation**: Every score is mathematically derived from observable resume text, taxonomy matching, and vector similarity.
3. **Actionable Feedback**: Highlights missing skills categorized by role priority (`core`, `important`, `additional`) to guide targeted project building.
4. **MongoDB Atlas Persistence**: Fully persistent data layer for user profiles, resume records, ATS analyses, hybrid recommendations, and interaction timelines.

---

## Core Features

- **ATS-Style Resume Heuristic**: Transparent multi-dimensional scoring across keyword coverage, section detection, quantitative metrics, and contact details.
- **Role Readiness Index**: Weighted readiness calculation against 12 standardized tech career paths.
- **Skill Gap Identification**: Ordered list of high-priority competencies absent from resume text.
- **Hybrid Job Matching**: Recommends relevant demo roles using a 70/30 blend of weighted skill overlap and TF-IDF cosine similarity.
- **Persistent Opportunity Tracking**: Bookmark, review, and track application milestones stored directly in MongoDB Atlas.

---

## Current Architecture

```
[ Browser Client (React 19 SPA + TypeScript) ]
  │
  ├─ Modular Pages: Landing, Analyze, Dashboard, Jobs, JobDetail, Reports
  ├─ Modular UI Components: common, layout, dashboard, resume, ats, skills, jobs
  ├─ PDF.js / Mammoth.js (Client-side text extraction)
  ├─ TanStack Query v5 (Data fetching & query cache)
  │
  ▼ HTTP REST (/api/* proxied to port 5000)
[ Express 5 API Server (Node.js + TypeScript) ]
  │
  ├─ Pino HTTP Logging & Zod Runtime Request/Response Validation
  ├─ Career Analysis Service (Regex Taxonomy & ATS Heuristics)
  ├─ Information Retrieval Engine (TF-IDF & Cosine Similarity)
  ├─ Interaction & Reports Services
  │
  ▼ Repository Data Access Layer
[ Repositories ]
  ├─ userRepository, resumeRepository, skillRepository, roleRepository
  ├─ jobRepository, atsRepository, recommendationRepository, interactionRepository
  │
  ▼
[ MongoDB Atlas Database ]
  ├─ users (Profile & target role preferences)
  ├─ skills (60+ skill taxonomy definitions & aliases)
  ├─ roles (12 target career paths with weighted requirements)
  ├─ jobs (168 synthetic curated demo job listings)
  ├─ resumes (Resume metadata & extracted skill records)
  ├─ ats_analyses (Transparent 6-dimension evaluation results)
  ├─ recommendations (Persisted ranking outcomes & explanations)
  └─ interactions (Persistent viewed, saved, and applied actions)
```

---

## AI/ML Methodology

### Skill Extraction
Extracts technical competencies via boundary-aware regex matching against a canonical taxonomy of 60+ skills and aliases. Confidence is calculated deterministically:

$$\text{Confidence} = \min\left(0.98, 0.68 + \min(3, \text{mentions} - 1) \times 0.08 + (\text{hasSkillsSection} ? 0.08 : 0)\right)$$

### Role Readiness
Measures the proportion of required skills demonstrated in the resume, weighted by importance:

$$\text{Readiness} = \left( \frac{\sum_{s \in \text{Matched}} \text{Weight}(s)}{\sum_{s \in \text{Role Skills}} \text{Weight}(s)} \right) \times 100$$

### ATS-Style Analysis
An explainable composite heuristic weighted across six observable dimensions:

$$\text{Score} = 0.30 \cdot K + 0.25 \cdot S + 0.15 \cdot Sec + 0.15 \cdot P + 0.10 \cdot C + 0.05 \cdot F$$

- **$K$ (Keywords, 30%)**: Weighted presence of target role competencies.
- **$S$ (Skills Section, 25%)**: Role skills explicitly placed within a detected `Skills` section.
- **$Sec$ (Sections, 15%)**: Recognition of 7 standard resume headings.
- **$P$ (Projects & Metrics, 15%)**: Presence of project sections, experience keywords, and quantified metric patterns (`%`, numbers).
- **$C$ (Contact Details, 10%)**: Verification of email, phone, LinkedIn, and GitHub links.
- **$F$ (Formatting, 5%)**: Minimum text length ($\ge 100$ chars) and clean non-alphanumeric ratio ($< 12\%$).

### TF-IDF (Term Frequency-Inverse Document Frequency)
Computes sparse vector representations for job descriptions and candidate resumes:

$$\text{IDF}(t) = \ln\left(1 + \frac{N}{1 + \text{DF}(t)}\right)$$

$$\text{TF-IDF}(t, d) = (1 + \ln(\text{count}(t, d))) \times \text{IDF}(t)$$

### Cosine Similarity
Calculates semantic text alignment between the candidate resume vector $\mathbf{u}$ and job listing vector $\mathbf{v}$:

$$\text{Sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$

### Hybrid Recommendation Score
Blends weighted skill coverage with vector similarity:

$$\text{MatchScore} = \text{round}(0.70 \times \text{SkillMatch} + 0.30 \times \text{TextSimilarity})$$

---

## Data

> **Important Disclosure on Job Data**: All 168 job listings in this repository are **curated synthetic demo opportunities** created solely for learning, skill comparison, and project planning. They do **not** represent live vacancies, and application actions are local tracking events only.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **Routing** | Wouter |
| **Data Fetching** | TanStack Query v5 (React Query) |
| **Backend** | Express 5, Node.js (ESM), TypeScript |
| **Database** | MongoDB Atlas (Official `mongodb` Node.js driver) |
| **API Contract & Validation** | OpenAPI 3.1, Zod, Orval |
| **Text Parsing** | `pdfjs-dist` (Client-side worker), `mammoth.browser` |
| **Logging** | Pino, Pino-HTTP |

---

## Project Structure

```
Career-Advisor/
├── artifacts/
│   ├── api-server/             # Express 5 API server
│   │   ├── src/
│   │   │   ├── db/             # MongoDB connection manager & index setup
│   │   │   ├── repositories/   # MongoDB data access layer
│   │   │   ├── services/       # Business logic (career analysis, reports, users)
│   │   │   ├── routes/         # REST API routes (career, jobs, activity, health)
│   │   │   └── data/           # Canonical seed data definitions
│   │   └── build.mjs           # esbuild production bundler
│   └── career-advisor/         # React 19 + Vite frontend
│       ├── src/
│       │   ├── pages/          # Modular page components (Landing, Dashboard, Jobs, etc.)
│       │   ├── components/     # Reusable UI components (layout, dashboard, jobs, common)
│       │   ├── hooks/          # Custom state hooks
│       │   ├── services/       # Storage & API client bindings
│       │   └── types/          # Shared frontend types
│       └── vite.config.ts      # Vite configuration & proxy settings
├── docs/                       # System documentation
│   ├── architecture.md         # System architecture & data flow
│   ├── mongodb.md              # MongoDB Atlas configuration guide
│   ├── data-model.md           # Database schemas, relationships, & indexes
│   └── future-architecture.md  # Roadmap (Auth, Embeddings, LLM)
├── lib/
│   ├── api-spec/               # OpenAPI 3.1 YAML definition & Orval codegen
│   ├── api-types/              # Generated Zod runtime validators
│   └── api-client-react/       # Generated TanStack Query React hooks
├── scripts/                    # Development scripts (seed-database.ts)
├── pnpm-workspace.yaml         # Monorepo workspace configuration
└── package.json                # Monorepo scripts
```

---

## Local Development

### 1. Prerequisites
- **Node.js**: v20.x or v22.x
- **pnpm**: v9.x or v11.x
- **MongoDB Atlas** account (or local MongoDB instance)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and provide your MongoDB connection string:
```bash
cp .env.example .env
```

```env
PORT=5000
BASE_PATH=/
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=ai_career_advisor
```

### 4. Seed Database
Run the idempotent seed script to populate roles, skills, synthetic jobs, and demo user:
```bash
pnpm seed
```

### 5. Start Development Servers
Run the backend API and frontend dev servers concurrently:
```bash
# Terminal 1: Backend API
pnpm --filter @ai-career-advisor/api run dev

# Terminal 2: Frontend Web App
pnpm --filter @ai-career-advisor/web run dev
```

The frontend will be accessible at `http://localhost:3000` (or `http://localhost:5173`), proxying `/api` requests to `http://localhost:5000`.

---

## Quality & Build Commands

```bash
# Typecheck all monorepo packages
pnpm run typecheck

# Build all packages for production
pnpm run build

# Regenerate API types and hooks from OpenAPI spec
pnpm --filter @ai-career-advisor/api-spec run codegen
```

---

## Current Limitations

- **Demo User Model**: Authentication (JWT / Sessions) is intentionally deferred to Phase 6. A centralized demo user (`Alex Sharma`) is currently used.
- **Deterministic AI Heuristics**: Recommendations use TF-IDF and keyword matching rather than neural dense embeddings or LLMs (scheduled for Phase 5).
- **Synthetic Opportunities**: Jobs are curated learning examples, not real-time postings from external job boards.

---

## Future Scope

See [docs/future-architecture.md](docs/future-architecture.md) for the planned evolution:
- **Phase 4**: Resume Pipeline Hardening & Test Suite
- **Phase 5**: Semantic Dense Embeddings & Vector Search
- **Phase 6**: User Authentication & Multi-Tenant Profiles
- **Phase 7**: Live Job Board Ingestion Pipelines
