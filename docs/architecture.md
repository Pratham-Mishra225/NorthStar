# AI Career Advisor — Current System Architecture

This document describes the **runtime architecture** of the AI Career Advisor platform after the completion of **Phase 3 (MongoDB Persistence Layer)**.

---

## 1. High-Level Architecture Overview

```
[ Browser / Single Page App (React 19 + TypeScript) ]
  │
  ├─ Modular Pages: Landing, Analyze, Dashboard, Jobs, JobDetail, Reports
  ├─ Modular UI Components: common, layout, dashboard, resume, ats, skills, jobs
  ├─ Client-Side Text Extraction: pdfjs-dist & mammoth.browser
  ├─ Data Fetching & Cache Management: TanStack Query v5
  │
  ▼ HTTP REST Calls (Proxied via Vite /api -> Express API on :5000)
[ Express API Server (Node.js + TypeScript) ]
  │
  ├─ Request Routing & Structured Logging: Express 5, Pino HTTP
  ├─ Contract Validation: Zod schemas generated from OpenAPI 3.1 specification
  │
  ▼ Services Layer
[ Business Services ]
  ├─ career-analysis.ts (Skill extraction, ATS heuristics, TF-IDF + Cosine similarity, hybrid fit)
  ├─ reports.ts (Persistent activity analytics, gap analysis, match distribution)
  ├─ interactionService.ts (User action management: viewed, saved, applied)
  ├─ userService.ts (Demo / active user management)
  │
  ▼ Repository / Data Access Layer
[ Repositories ]
  ├─ userRepository.ts
  ├─ resumeRepository.ts
  ├─ skillRepository.ts
  ├─ roleRepository.ts
  ├─ jobRepository.ts
  ├─ atsRepository.ts
  ├─ recommendationRepository.ts
  └─ interactionRepository.ts
  │
  ▼ Connection Pooling & Index Management
[ MongoDB Atlas (Official MongoDB Node.js Driver) ]
  ├─ users (Profile & preferences)
  ├─ skills (60+ canonical skill taxonomy & aliases)
  ├─ roles (12 target career paths with weighted priorities)
  ├─ jobs (168 synthetic curated demo opportunities)
  ├─ resumes (Resume metadata & extracted skills)
  ├─ ats_analyses (Transparent 6-dimension evaluation results)
  ├─ recommendations (Persisted ranking outcomes & explanations)
  └─ interactions (Persistent viewed/saved/applied action logs)
```

---

## 2. Core Subsystems

### 2.1 Client-Side Text Extraction & Privacy Model
- **PDF Extraction**: Processed in-browser using `pdfjs-dist` web worker.
- **DOCX Extraction**: Processed in-browser using `mammoth.browser`.
- **Privacy Model**: Resume text is extracted in the client and transmitted over HTTPS for processing. The backend persists the structured resume record and extracted skills to MongoDB for workspace continuity.

### 2.2 Skill Extraction & Normalization
- **Methodology**: Deterministic rule-based substring & alias scanning against the canonical `skills` collection.
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
Blends weighted skill overlap with vector text similarity against the persistent job collection:
- **TF-IDF Calculation**: Sublinear term frequency ($1 + \ln(\text{count})$) scaled by $\text{IDF}(t) = \ln(1 + \frac{N}{1 + \text{DF}(t)})$.
- **Cosine Similarity**: Vector dot product over normalized Euclidean lengths.
- **Blended Score**:
  $$\text{MatchScore} = \text{round}(0.7 \times \text{SkillMatch} + 0.3 \times \text{TextSimilarity})$$

---

## 3. Data Flow & Persistence

1. **User Action Persistence**: When a user saves, views, or marks a role applied, a `POST /api/interactions` request records the event in the `interactions` collection in MongoDB Atlas.
2. **Workspace Continuity**: Restarting the browser or server preserves all saved roles, application statuses, resume history, and report analytics.
3. **Single Source of Truth**: MongoDB Atlas is the authoritative runtime data store. Browser `localStorage` is no longer used as primary storage.
