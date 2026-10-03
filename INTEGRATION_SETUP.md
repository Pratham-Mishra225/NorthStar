# AI Career Advisor — Integration Status

The application currently operates with zero external APIs and zero remote databases. It uses a React/Vite frontend and an Express 5 API server with an in-memory synthetic catalog and browser-local state storage.

---

## 1. Current Runtime Data Flow

| Capability | Current Source | Persistence |
| :--- | :--- | :--- |
| **Resume Text Extraction** | PDF.js, Mammoth.js, or text paste in browser | Client-side memory (never stored on server) |
| **Skill & ATS Analysis** | Deterministic Express heuristic services | In-memory evaluation; results cached in `localStorage` |
| **Job Recommendations** | Weighted skill overlap + in-memory TF-IDF / Cosine Similarity | Curated synthetic dataset (168 demo jobs) |
| **User Activity (Save / Apply)** | Client-side React interactions | Browser `localStorage` (`career-advisor-demo-v1`) |
| **Reports & Analytics** | Express baseline + client-side activity aggregation | Browser session only |

---

## 2. Currently Working Capabilities

- Curated demo job catalog (168 synthetic listings across 12 roles)
- Deterministic skill extraction from resume text against a 60-skill taxonomy
- TF-IDF vectorization and cosine similarity matching
- Explainable ATS-style resume analysis (6 weighted categories)
- Role readiness scoring based on prioritized skill weights
- Browser-local activity tracking (viewed, saved, marked applied)
- Progress reporting with Recharts visualizations

---

## 3. Future Placeholders & Roadmap

The following integrations are **not implemented** in the current phase:

| Service / Capability | Planned Target | Notes |
| :--- | :--- | :--- |
| **Persistent Database** | Phase 3 (MongoDB) | Store authenticated user profiles, saved jobs, and historical analysis reports |
| **Semantic AI Embeddings** | Phase 4 (Transformers / Vector DB) | Dense vector retrieval and contextual skill entity recognition |
| **Live Job Feeds** | Phase 5 (External Job APIs) | Replace synthetic listings with real open vacancies |
| **User Authentication** | Phase 3 (JWT / OAuth 2.0) | Secure multi-tenant user account isolation |
| **LLM Inference** | Future Phase | Personalized career coaching suggestions and resume rewriting guidance |
| **Course Recommendations** | Future Phase | Integration with online learning catalogs (Coursera, edX) |