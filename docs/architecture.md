# AI Career Advisor — Current System Architecture

This document describes the **as-is runtime architecture** of the AI Career Advisor application.

---

## 1. High-Level Architecture Overview

```
[ Browser / Single Page App ]
  │
  ├─ PDF / DOCX / TXT Extraction (pdfjs-dist & mammoth client-side)
  ├─ Browser Session State (localStorage key: 'career-advisor-demo-v1')
  ├─ State Management & Data Fetching (TanStack Query v5)
  ├─ UI Framework (React 19 SPA, Tailwind CSS v4, Lucide, Recharts)
  │
  ▼ HTTP REST Calls (Proxied via Vite /api -> http://127.0.0.1:5000)
[ Express API Server (:5000) ]
  │
  ├─ Request Routing & Logging (Express 5, Pino HTTP)
  ├─ Runtime Validation (Zod schemas generated from OpenAPI 3.0 spec)
  │
  ▼ In-Memory Computation Layer
[ Services Layer (career-analysis.ts, reports.ts) ]
  │
  ├─ Rule-Based Skill Extraction (skillTaxonomy word-boundary scanning)
  ├─ Role Readiness Scoring (Weighted skill coverage)
  ├─ ATS-Style Heuristic Engine (6 weighted observable dimensions)
  ├─ Information Retrieval Engine (TF-IDF vectorizer + Vector Cosine Similarity)
  │
  ▼ Static Catalog (career-data.ts)
[ In-Memory Data Store ]
  ├─ 12 Target Tech Roles (with priority-ranked requirements)
  ├─ 60+ Skill Taxonomy Definitions & Aliases
  └─ 168 Procedurally Generated Synthetic Demo Job Listings
```

---

## 2. Core Subsystems

### 2.1 Client-Side Text Extraction & Privacy Model
- **PDF Extraction**: Processed in-browser using `pdfjs-dist` web worker. Text items are assembled page-by-page.
- **DOCX Extraction**: Processed in-browser using `mammoth.browser`.
- **Text Bounds**: Resumes must contain between 20 and 100,000 characters.
- **Privacy Model**: Raw resume text is **never persisted** to disk or a database. It exists in memory only for the duration of POST request analysis.

### 2.2 Skill Extraction & Normalization
- **Methodology**: Deterministic rule-based substring & alias scanning against a curated `skillTaxonomy` of 60 technical and business competencies.
- **Confidence Formula**:
  $$\text{Confidence} = \min\left(0.98, 0.68 + \min(3, \text{mentions} - 1) \times 0.08 + (\text{hasSkillsSection} ? 0.08 : 0)\right)$$

### 2.3 ATS-Style Heuristic Scoring
Evaluates 6 transparent dimensions:
1. **Keyword Coverage (30%)**: Weighted presence of target role requirements.
2. **Skills Section Alignment (25%)**: Presence of role skills inside a dedicated `Skills` section.
3. **Section Structure (15%)**: Detection of standard headings (Summary, Education, Skills, Projects, Experience, Certifications, Achievements).
4. **Projects & Metrics (15%)**: $45\% \text{ Projects} + 30\% \text{ Experience} + 25\% \text{ Quantified Metrics}$.
5. **Contact Information (10%)**: Email, Phone, LinkedIn, and GitHub links ($25\%$ each).
6. **Formatting Signals (5%)**: Character length, non-standard character ratio, and structural integrity.

### 2.4 Hybrid Recommendation Engine
Blends weighted skill overlap with vector text similarity against the 168 synthetic job catalog:
- **TF-IDF Calculation**: Sublinear term frequency ($1 + \ln(\text{count})$) scaled by $\text{IDF}(t) = \ln(1 + \frac{N}{1 + \text{DF}(t)})$.
- **Cosine Similarity**: Vector dot product over normalized Euclidean lengths.
- **Blended Score**:
  $$\text{MatchScore} = \text{round}(0.7 \times \text{SkillMatch} + 0.3 \times \text{TextSimilarity})$$

---

## 3. Data & Storage Model

- **Server-side**: Purely stateless in-memory catalog.
- **Client-side**: Browser `localStorage` persists user interaction flags (`viewed`, `saved`, `applied`) and local analysis summaries without saving raw resume text.
