# AI Career Advisor

A career readiness and resume alignment platform designed for students and early-career professionals. Upload a resume, select a target tech role, and receive explainable, evidence-backed evaluation—including an ATS-style heuristic score, prioritized skill gap analysis, and hybrid TF-IDF job recommendations.

---

## Overview

Job applicants frequently submit resumes without clear visibility into how well their experience matches target job descriptions. **AI Career Advisor** addresses this by providing deterministic, transparent analysis that maps specific text evidence to role requirements, eliminating opaque "black-box" scoring.

---

## Problem Statement

- **Opaque Scoring**: Commercial ATS simulators often generate arbitrary percentages without actionable evidence.
- **Blind Applications**: Students often apply to roles without knowing which core competencies are missing from their resumes.
- **Privacy Concerns**: Many AI career tools upload and persist sensitive candidate PII on remote servers without clear retention policies.

---

## Solution

AI Career Advisor delivers an explainable, privacy-first career evaluation engine:
1. **Client-Side Text Extraction**: Resumes are parsed directly in the browser (via PDF.js and Mammoth.js). Raw resume text is **never stored on the server**.
2. **Deterministic Evaluation**: Every score is mathematically derived from observable resume text, taxonomy matching, and vector similarity.
3. **Actionable Feedback**: Highlights missing skills categorized by role priority (`core`, `important`, `additional`) to guide targeted project building.

---

## Core Features

- **ATS-Style Resume Heuristic**: Transparent multi-dimensional scoring across keyword coverage, section detection, quantitative metrics, and contact details.
- **Role Readiness Index**: Weighted readiness calculation against 12 standardized tech career paths.
- **Skill Gap Identification**: Ordered list of high-priority competencies absent from resume text.
- **Hybrid Job Matching**: Recommends relevant demo roles using a 70/30 blend of weighted skill overlap and in-memory TF-IDF cosine similarity.
- **Browser-Local Interaction Tracking**: Bookmark, review, and track application milestones locally without requiring an account.

---

## Current Architecture

```
[ Browser Client (React 19 SPA) ]
  │
  ├─ PDF.js / Mammoth.js (Client-side text extraction)
  ├─ localStorage (Demo activity & interaction flags)
  ├─ TanStack Query v5 (Data fetching & query cache)
  │
  ▼ HTTP REST (/api/* proxied to port 5000)
[ Express 5 API Server ]
  │
  ├─ Pino HTTP Logging & Zod Runtime Request/Response Validation
  ├─ Career Analysis Service (Regex Taxonomy & ATS Heuristics)
  ├─ Information Retrieval Engine (TF-IDF & Cosine Similarity)
  │
  ▼
[ In-Memory Static Store ]
  ├─ 12 Target Roles with Weighted Requirements
  ├─ 60+ Skill Definitions with Aliases
  └─ 168 Synthetic Job Listings (Catalog)
```

---

## AI/ML Methodology

### Skill Extraction
Extracts technical competencies via boundary-aware regex matching against a taxonomy of 60+ skills and aliases. Confidence is calculated deterministically:

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
Final match scoring balances hard skill requirements with holistic text overlap:

$$\text{MatchScore} = \text{round}(0.7 \times \text{SkillMatch} + 0.3 \times \text{TextSimilarity})$$

---

## Data

The application operates on a **curated synthetic demo dataset** containing:
- **12 Target Tech Roles**: Data Analyst, Frontend Developer, Backend Developer, Full Stack Engineer, ML Engineer, etc.
- **168 Synthetic Job Postings**: Procedurally generated job descriptions with salary ranges, work modes, and required skill profiles.
- **Demo Resume**: Standard sample profile for instant exploration without uploading files.

> **Notice**: Job postings are illustrative learning examples and do not represent open live vacancies.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, Wouter |
| **Data Fetching** | TanStack Query v5 |
| **Document Extraction** | PDF.js (`pdfjs-dist`), Mammoth.js |
| **Visualizations** | Recharts, Lucide Icons |
| **Backend API** | Express 5, Node.js (bundled via esbuild), Pino HTTP |
| **Validation & Types** | Zod, OpenAPI 3.0, Orval (automated client/schema generation) |
| **Package Manager** | pnpm Workspaces |

---

## Project Structure

```
├── artifacts/
│   ├── career-advisor/          # React 19 Frontend (@ai-career-advisor/web)
│   │   ├── src/                 # Application source & UI components
│   │   ├── public/              # Static brand assets
│   │   └── vite.config.ts       # Vite build & API proxy configuration
│   └── api-server/              # Express 5 API Server (@ai-career-advisor/api)
│       └── src/
│           ├── data/            # Static role taxonomy and synthetic jobs
│           ├── routes/          # REST route handlers
│           └── services/        # Career analysis, ATS scoring & TF-IDF
├── lib/
│   ├── api-spec/                # OpenAPI 3.0 specification & Orval config
│   ├── api-zod/                 # Generated Zod validation schemas
│   └── api-client-react/        # Generated TanStack Query React hooks
├── docs/
│   ├── architecture.md          # Current runtime architecture details
│   └── future-architecture.md   # Roadmap for database & ML enhancements
├── scripts/                     # Utility scripts
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Local Development

### Prerequisites
- **Node.js**: v20+ 
- **pnpm**: v9+

### Installation
```bash
# Clone the repository
git clone https://github.com/Pratham-Mishra225/NorthStar.git
cd NorthStar

# Install all workspace dependencies
pnpm install
```

### Running the Application

In a terminal, start the Express API server (port 5000):
```bash
pnpm --filter @ai-career-advisor/api run dev:build
pnpm --filter @ai-career-advisor/api run dev
```

In a second terminal, start the Vite frontend (port 3000):
```bash
pnpm --filter @ai-career-advisor/web run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Typecheck & Build
```bash
# Typecheck all packages
pnpm run typecheck

# Build frontend and backend bundles
pnpm run build
```

---

## Environment Variables

Copy `.env.example` to create your local configuration:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `5000` | Express API server port |
| `BASE_PATH` | No | `/` | Vite base path |

No third-party API keys or database connections are required for local execution.

---

## Current Limitations

- **Stateless Backend**: User interaction history and uploaded analyses are held in browser `localStorage` rather than a centralized database.
- **Synthetic Data**: Recommendations match against 168 procedurally generated roles rather than a real-time live job feed.
- **Rule-Based Extraction**: Skills are detected via explicit taxonomy keywords rather than deep contextual NLP/NER.

---

## Future Scope

- **Phase 2**: Modularize frontend SPA into dedicated page and component directories.
- **Phase 3**: Integrate MongoDB for authenticated multi-user persistence and historical tracking.
- **Phase 4**: Implement dense transformer embeddings for semantic skill matching.
- **Phase 5**: Connect live job APIs (e.g. Adzuna, Remotive) for real-world vacancy discovery.

---

## License

MIT
