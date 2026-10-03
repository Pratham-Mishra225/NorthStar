# AI Career Advisor — Integration Status

The MVP runs without external APIs. It uses the existing React/Vite client and
Express API. This project does not currently contain a FastAPI service or a
database connection.

## Current data flow

| Capability | Current source | Persistence |
| --- | --- | --- |
| Resume extraction | PDF.js, Mammoth, or pasted text in the browser | Extracted text stays in the current browser session |
| Skill, readiness, and ATS analysis | Deterministic Express analysis using the role and skill catalog | Analysis result is kept in browser storage |
| Job recommendations | Weighted skill overlap plus TF-IDF/cosine text similarity | Curated demo job catalog |
| Job save/view/applied actions | Browser UI | Browser-local storage; "applied" never submits an application |
| Reports | Demo report baseline plus local activity and analysis | Browser-local actions are not sent to the shared API |

Existing API capabilities include health status, dashboard and role
requirements, resume analysis, job search/details, recommendations, and a
demo reports baseline. Resume-analysis requests return results but do not
save raw resume text or personal activity on the server.

## CURRENTLY WORKING

- Local/demo job data (curated dataset in `artifacts/api-server/src/data/`)
- Deterministic skill extraction from resume text
- TF-IDF/cosine similarity for job matching
- ATS-style resume analysis (explainable heuristic)
- Role readiness scoring (weighted skill matching)
- Browser-local activity tracking (viewed, saved, marked applied)
- Reports with activity charts

## FUTURE PLACEHOLDERS

The following are not implemented. Do not add them until the privacy and
identity model has been decided and approved:

### Database persistence

`lib/db/` contains a Drizzle + PostgreSQL scaffold. It is not wired up.
The current design intentionally keeps user activity in each browser because
the MVP has no login or account-isolation system.

**Before activating database persistence:**

1. Add `DATABASE_URL` as a server-side environment variable (never in source control, client-side code, or logs).
2. Configure the non-secret `DATABASE_NAME` value in the server environment.
3. Decide whether records are anonymous per-browser or attached to authenticated users before persisting resume analyses or interactions.
4. Add server-side validation, indexes, a documented seed/reset process, and database-backed report queries.
5. Keep the current demo/local mode available when the database is not configured.

### Other services not yet integrated

| Service | Notes |
| --- | --- |
| Live job APIs | Replace the demo dataset; requires API key and rate-limit handling |
| LLM provider | Improve skill extraction or generate richer explanations |
| Authentication | Required before persisting any user data server-side |
| Course provider | Third-party course catalog for skill gap recommendations |
| Email | Reminder or summary emails |
| Analytics | Privacy-compliant usage analytics |

Store any credentials as server-side environment variables and document the
provider's data handling and failure behavior here when adding them.