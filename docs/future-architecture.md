# AI Career Advisor — Future Architecture Roadmap

This document outlines architectural enhancements planned for subsequent project phases. **None of these components are currently connected or active in the runtime codebase.**

---

## 1. Target Architecture Vision

```
[ Frontend (React SPA / Next.js) ]
  │
  ├─ User Authentication (JWT / OAuth 2.0)
  ├─ Session Resume Management
  │
  ▼
[ API Gateway / Node.js Express ]
  │
  ├─ Auth Middleware & Rate Limiting
  ├─ REST API Endpoints
  │
  ├──────────────────────┬──────────────────────┬──────────────────────┐
  ▼                      ▼                      ▼                      ▼
[ MongoDB Database ]   [ Vector Database ]   [ Live Job Ingestion ]  [ LLM Inference ]
- User profiles        - Document embeddings  - External Job APIs    - Contextual feedback
- Saved roles          - Semantic job search  - Daily sync pipeline  - Improvement plans
- Activity history     - Dense retrieval      - Deduplication        - Skill gap courses
```

---

## 2. Planned Enhancements by Phase

### Phase 2: Frontend Modularization
- Split the 778-line monolithic `App.tsx` into modular pages (`/pages/Landing`, `/pages/Dashboard`, `/pages/Analyze`, `/pages/Jobs`, `/pages/Reports`) and reusable atomic UI components.
- Establish dedicated custom hooks for localStorage synchronization and resume upload state.

### Phase 3: Persistent Database Integration (MongoDB)
- Connect a genuine MongoDB database using Mongoose or MongoDB Node Driver.
- Store user profiles, saved jobs, application status logs, and historical analysis reports.
- Isolate demo mode from persistent authenticated mode.

### Phase 4: Semantic Search & AI Embeddings
- Replace regex-only skill extraction with NLP Named Entity Recognition (NER) or semantic embeddings (e.g. `all-MiniLM-L6-v2` or OpenAI embeddings).
- Enhance vector matching from sparse TF-IDF to dense vector cosine similarity.

### Phase 5: Live Job Feed Integration
- Integrate live job provider APIs (e.g. Adzuna, Remotive, JSearch) to complement the static synthetic dataset with real vacancies.
- Implement rate limiting, caching, and currency conversion.
