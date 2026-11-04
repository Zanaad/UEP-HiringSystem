# HirePrep Implementation Plan

This plan picks up from the current state of the repo and ends at a working MVP with the three core features from the design document:

1. Job management (recruiters)
2. Applicant tracking pipeline (recruiters)
3. AI mock interviews (candidates)

**Constraint:** no Amazon Bedrock. The AI layer uses a free LLM provider behind a small interface, so the provider can be swapped later (see [AI provider](#5-ai-provider-free-replacing-bedrock)).

---

## 1. Where things stand

### Already built (in this repo)

| Area | Status |
|---|---|
| Docker Compose (MySQL 8, FastAPI, React/nginx) | Done |
| Alembic migrations | `users` table with `password_hash` and `role` |
| Backend layering | `routes → controllers → services → repositories → models` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, JWT, `require_roles()` dependency |
| Users | `GET /users/{id}` with a role check |
| Backend tests | `tests/test_auth.py` (SQLite, 7 tests) |
| Frontend | Vite + React 19 + TS, router with `RoleGuard`, Login/Register pages wired to the API |
| Frontend stubs | All dashboard/jobs/pipeline/mock-interview/settings pages are 3-line placeholders |
| Service stubs | `jobs.service.ts`, `applications.service.ts`, `interviews.service.ts` call endpoints that don't exist yet |
| CI | GitHub Actions builds and pushes Docker images. It runs no tests or lint. |

### The Figma export (`~/Downloads/HirePrep SaaS Web Platform/`)

This is a full React + Tailwind v4 + shadcn/ui front end that runs on mock data (`src/app/data/mockData.ts`). It is the visual target, and most of its code can be reused directly.

Pages the Figma router actually uses (the source of truth when porting):

| Route | Figma file | Notes |
|---|---|---|
| `/` | `pages/LandingPage.tsx` | Marketing page with testimonials and pricing (static) |
| `/login`, `/register` | `pages/Login.tsx`, `pages/Register.tsx` | Register has a recruiter/candidate toggle |
| `/recruiter` | `pages/RecruiterDashboard.tsx` | Stats and a chart (recharts) |
| `/recruiter/jobs` | `pages/JobManagement.tsx` | CRUD dialog: title, department, location, type, salary, description |
| `/recruiter/pipeline` | `pages/CandidatePipeline.tsx` | Kanban with drag and drop (react-dnd), filtered by job |
| `/recruiter/candidates/:id` | `pages/CandidateProfile.tsx` | Overview, ATS score, notes, timeline, schedule interview, send email |
| `/recruiter/jobs/:jobId/ats` | `pages/recruiter/ATSScreening.tsx` | Applicants ranked by ATS match score |
| `/candidate` | `pages/CandidateDashboard.tsx` | My applications and progress |
| `/candidate/jobs` | `pages/candidate/JobSearch.tsx` | Search, filters, ATS match %, apply dialog |
| `/candidate/mock-interview/:id` | `pages/MockInterview.tsx` | Question → answer → AI feedback (score, strengths, improvements) |
| `*/settings` | `pages/Settings.tsx` | Profile, resume upload, company info, password, notifications, billing |

These files are **unused duplicates** and should not be ported: `LoginPage`, `RegisterPage`, `RoleSelectionPage`, `SettingsPage`, `candidate/CandidateDashboard`, `candidate/MockInterviewPage`, `recruiter/{CandidatePipeline, JobManagement, RecruiterDashboard, CandidateProfilePage}`.

Some things in the Figma design go beyond the design document:

- A **"Technical"** pipeline stage: `applied → screening → interview → technical → offer → hired`
- **ATS match scoring**: rule-based, using skills (50%), experience (25%), education (15%) and location (10%). No AI is needed, so it is free and deterministic.
- Scheduling **real interviews**, recruiter **notes**, and a candidate **timeline**
- Billing, plans, 2FA and push notifications. These are UI only and are out of scope for the MVP.

### Problems in the existing code to fix first

1. **Passwords use unsalted SHA-256** (`backend/app/services/auth_utils.py`), even though `bcrypt` and `passlib` are in `requirements.txt`. Switch to bcrypt. No real users exist yet, so no hashes need migrating.
2. **`SECRET_KEY`** falls back to `"change-me-in-production"` and is not passed in `docker-compose.yml` or `.env.example`.
3. **`requirements.txt`** pins unused packages (`boto3`, `celery`, `redis`, `kombu`, `billiard`, and others). Remove them, and add `pytest` and `httpx` for tests.
4. **Tailwind is installed in the frontend but not wired up.** There is no `@tailwindcss/vite` plugin and no theme CSS. This has to be done before porting the Figma pages.
5. **CI runs no tests.** Add `pytest`, `npm run lint` and `npm run build` steps before the Docker push.
6. Local `main` is one commit behind `origin/main`. Run `git pull` before starting.

---

## 2. Target architecture

```
React (Vite, Tailwind, shadcn/ui, React Query)
        │  REST + JWT
        ▼
FastAPI  ── routes → controllers → services → repositories → SQLAlchemy models
        │                    │
        ▼                    ▼
     MySQL 8           LLM provider interface
  (RDS in prod)        ├─ GeminiProvider   (default, free tier)
                       ├─ GroqProvider     (alternative free tier)
                       ├─ OllamaProvider   (fully local, offline)
                       └─ FakeProvider     (tests/CI, deterministic)
```

- The existing layering stays as it is. Each new domain gets its own model, schema, repository, service and controller.
- AI calls are **synchronous** inside the request for the MVP. A call takes a few seconds, which is acceptable. Celery and Redis are not needed.
- Uploaded resumes go to a local Docker volume (`/app/uploads`) during development. S3 can be added later if the app is deployed to AWS.

---

## 3. Data model

New tables, one Alembic migration per phase:

```
users                      (exists) id, name, email, password_hash, role, created_at,
                           company_id FK NULL                     -- set for recruiters

companies                  (exists) id, name, created_at
                           + website, industry, size, location    -- phase 5 settings

candidate_profiles         (exists) user_id PK/FK, headline, phone, location,
                           linkedin_url, github_url, portfolio_url,
                           skills JSON, experience_years INT,
                           education_level ENUM(high-school,bachelor,master,phd),
                           resume_path, resume_filename, updated_at

jobs                       (exists) id, company_id FK, created_by FK users,
                           title, department, location, employment_type
                             ENUM(full-time,part-time,contract,internship),
                           salary_range, description TEXT,
                           required_skills JSON, min_experience_years,
                           education_level, status ENUM(draft,active,closed),
                           created_at, updated_at

applications               (exists) id, job_id FK, candidate_id FK,
                           stage ENUM(applied,screening,interview,technical,offer,hired,rejected),
                           ats_score INT, ats JSON (full breakdown), cover_note TEXT,
                           created_at, updated_at
                           UNIQUE(job_id, candidate_id)

application_events         (exists) id, application_id FK, from_stage, to_stage,
                           changed_by FK users, created_at        -- timeline

application_notes          (exists) id, application_id FK, author_id FK, body, created_at

scheduled_interviews       id, application_id FK, type ENUM(phone,video,onsite,technical),
                           scheduled_at DATETIME, interviewer_name, notes,
                           status ENUM(scheduled,completed,cancelled)       -- phase 6

mock_interview_sessions    id, candidate_id FK, job_id FK NULL, track VARCHAR NULL,
                           status ENUM(in_progress,completed), overall_score NULL,
                           llm_provider, llm_model, created_at, completed_at

mock_interview_questions   id, session_id FK, position, category, question TEXT, tip TEXT

mock_interview_answers     id, question_id FK UNIQUE, answer TEXT, score INT,
                           strengths JSON, improvements JSON, suggestion TEXT,
                           created_at
```

A mock interview is tied either to a **job** (`job_id`, as in the design document flow) or to a generic **track** such as "Behavioral" or "System Design" (as in the Figma practice cards).

---

## 4. API

All endpoints except auth and the public job listing need a JWT. `R` means recruiter only and `C` means candidate only.

### Auth and profile
| Method | Path | Who |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public (exists) |
| GET | `/auth/me` | any (exists) |
| POST | `/auth/change-password` | any |
| GET/PUT | `/me/profile` | C (candidate profile; saving re-scores the candidate's applications) |
| PUT/GET | `/me/resume` | C (upload: PDF/DOCX, max 5 MB, checked by file signature; download own file) |
| GET/PUT | `/me/company` | R |

### Jobs
| Method | Path | Who |
|---|---|---|
| GET | `/jobs?q=&employment_type=&page=&page_size=` | public (active jobs only; `q` matches title, department, location and company) |
| GET | `/recruiter/jobs` | R (own company's jobs, including drafts and closed jobs) |
| POST | `/jobs` | R (created as `draft` or `active`) |
| PATCH | `/jobs/{id}` | R (own company only, otherwise 404; also publishes, closes and reopens via `status`) |

### Applications and pipeline
| Method | Path | Who |
|---|---|---|
| POST | `/applications` `{job_id, cover_note}` | C (active jobs only, otherwise 404; duplicates get 409) |
| GET | `/applications/mine` | C (with job and stage history; never includes notes) |
| GET | `/applications?job_id=` | R (own company's jobs only; ranked by ATS score; used by both the pipeline and the ATS screening page) |
| GET | `/applications/{id}` | R (profile, ATS breakdown, timeline, notes) |
| PATCH | `/applications/{id}/status` `{stage}` | R (writes an `application_events` row) |
| POST | `/applications/{id}/notes` | R |
| GET | `/applications/{id}/resume` | R (only for applications to the recruiter's own company) |

When a signed-in candidate calls `GET /jobs`, each result also includes their `match` and whether they have `applied`. This replaces the planned `/jobs/{id}/match` and `/jobs/{id}/ats` endpoints.

### Mock interviews
| Method | Path | Who |
|---|---|---|
| POST | `/mock-interviews/start` `{job_id? , track?, num_questions?}` | C |
| GET | `/mock-interviews` | C (history) |
| GET | `/mock-interviews/{id}` | C (session, questions and answers) |
| POST | `/mock-interviews/{id}/answers` `{question_id, answer}` | C (returns feedback) |
| POST | `/mock-interviews/{id}/complete` | C (computes the overall score and summary) |

### Dashboards
| Method | Path | Who |
|---|---|---|
| GET | `/recruiter/stats` | R (active jobs, applicants per stage, applications over time) |
| GET | `/candidate/stats` | C (applications by stage, mock interview average score) |

---

## 5. AI provider (free, replacing Bedrock)

### Recommendation

The default is the **Google Gemini API free tier**, using the current "Flash" model. It needs no credit card, gives enough daily requests for a student project, and supports **structured JSON output** with a response schema. That suits both question generation and scoring.

Two alternatives sit behind the same interface:

- **Groq free tier** (open models such as Llama). Very fast, with an OpenAI-compatible API and JSON mode.
- **Ollama**, running a small model locally in Docker. It is completely free, needs no API key and works offline, but it is slower and lower quality, and too heavy for a small EC2 instance. It is useful for development without internet access.

Free-tier limits and model names change often, so **check them when you set this up** and keep the model name in an environment variable.

> Note: Google may use data from the Gemini free tier to improve its products. Do not send names, emails or other personal data in prompts. Send only the job description, the questions and the answer text, and mention this in the app's privacy text.

### Interface

```python
# backend/app/ai/provider.py
class LLMProvider(Protocol):
    def generate_questions(self, job_context: str, track: str | None, n: int) -> list[GeneratedQuestion]: ...
    def evaluate_answer(self, question: str, answer: str, job_context: str) -> AnswerFeedback: ...
```

- `GeneratedQuestion` and `AnswerFeedback` are Pydantic models, and the provider's JSON output is validated against them.
- The provider is chosen with `LLM_PROVIDER=gemini|groq|ollama|fake`, plus `LLM_API_KEY` and `LLM_MODEL`.
- `FakeProvider` returns fixed data. Tests and CI use it, so they never need an API key.
- Calls use plain `httpx` against each provider's REST API. No SDK is needed, which keeps dependencies small.

### Safety and robustness
- **Prompt injection:** wrap the job description and the candidate's answer in clear delimiters, and instruct the model to treat them as data. Never let model output change data other than the feedback fields.
- **Output validation:** use Pydantic validation, clamp scores to 0–100, retry once if the JSON is invalid, then return a friendly "feedback unavailable" message.
- **Timeouts:** a 30-second timeout on each call. When the provider fails, the session still works: questions fall back to a static question bank (taken from the Figma `MockInterview.tsx` data), and an answer is stored with `score = NULL` so feedback can be retried later.
- **Quota protection:** limit each candidate per day, for example 5 sessions and 50 evaluated answers (`MOCK_INTERVIEW_DAILY_LIMIT`). Cap answers at 4,000 characters.

---

## 6. ATS match scoring (no AI)

The scoring is a server-side port of `computeATS()` from the Figma `ATSScreening.tsx`, kept in `backend/app/services/ats_service.py`:

| Factor | Weight | Rule |
|---|---|---|
| Skills | 50% | Matched required skills ÷ all required skills (case-insensitive) |
| Experience | 25% | Meets the minimum: 80–100, scaled up by extra years. Below the minimum: proportional up to 80. |
| Education | 15% | Meets the required level: 100. Otherwise: 60. |
| Location | 10% | Remote, or the same location: 100. Otherwise: 70. |

The verdicts are: strong (80 or more), good (65 or more), fair (50 or more), and weak (below 50).

The score is computed when a candidate applies and stored in `applications.ats_score`. It is recomputed when the job's requirements or the candidate's profile change. Unit tests cover it, because it is pure logic.

---

## 7. Phased roadmap

Each phase ends in something that can be demoed and merged as its own PR.

### Phase 0: Foundation fixes (about 1 day)
- [ ] `git pull` to catch up with `origin/main` (needs your GitHub credentials)
- [x] Switch password hashing to bcrypt (pre-hashed with SHA-256 so passwords longer than 72 bytes still count). Login with an unknown email now takes the same time as a wrong password.
- [x] Fix login stripping whitespace from passwords when registration did not
- [x] `SECRET_KEY` is now required (min 32 chars) and set in `.env.example` and `docker-compose.yml`. The `LLM_*` and `UPLOAD_DIR` settings move to Phases 4 and 3, when they are first used.
- [x] Trim `requirements.txt` to direct dependencies. Replace `python-jose` with `PyJWT` and drop `passlib`. Add `requirements-dev.txt` (`pytest`, `httpx2`, `ruff`) and `ruff.toml`.
- [x] Add `created_at` to `users` (migration `0003`, tested on MySQL 8.1)
- [x] CI: `ruff` and `pytest` for the backend, `npm run lint` for the frontend. The Docker push runs only if these pass (the frontend build runs inside the Docker build).
- [x] Move base images off end-of-life versions: Python 3.10 → 3.12, Node 20 → 22, nginx 1.27 → stable
- [ ] Remove the stray `/test` file at the repo root (added in #7) if it isn't needed

### Phase 1: Port the design system and layouts (2–3 days)
- [x] Wire up Tailwind v4 (`@tailwindcss/vite`). The Figma theme lives in `styles/globals.css`, with `--primary` set to the blue the pages actually use.
- [x] Port only the shadcn components in use so far (`button`, `input`, `label`, `card`), plus a `FormField` helper. Later phases add more as needed.
- [x] Skip MUI, react-slick, masonry and the other unused Figma dependencies
- [x] Merge the two sidebar layouts into one `AppLayout` (navigation chosen by role, with a mobile menu), keeping `RoleGuard`
- [x] Port `LandingPage` (fake testimonials, pricing and unsupported claims removed), `Login` and `Register`, using react-hook-form and zod
- [x] Add a React Query `QueryClientProvider` (cache cleared on logout), plus an axios 401 interceptor that logs the user out
- [x] Add a Zustand `useAuthStore` (persisted) instead of reading `localStorage` directly in components
- [x] Lazy-load each page so a route only downloads its own code

### Phase 2: Job management (2–3 days)
- [x] Backend: `companies` and `jobs` models and migration `0004`, plus repository, service and controller. Recruiters link to a company with `users.company_id` instead of a separate `recruiter_profiles` table.
- [x] Recruiters enter a company name when they register
- [x] Ownership checks: a recruiter can only see and edit their own company's jobs. Other jobs return 404, so their existence isn't revealed.
- [x] Tests: the job lifecycle and who can see each job, another company's recruiter, rejecting nulls on update, search, filters and pagination
- [x] Frontend: port `JobManagement.tsx` with React Query and react-hook-form with zod, plus fields for required skills, minimum experience and education. Publish, close and reopen buttons replace the Figma dropdown menu.
- [x] Frontend: port `JobSearch.tsx` with server-side search (debounced), a type filter and pagination. Apply, ATS match and applicant counts arrive in Phase 3.

### Phase 3: Applications and pipeline (3–4 days)
- [x] Backend: `candidate_profiles`, `applications`, `application_events` and `application_notes` (migration `0005`)
- [x] `ats_service.py` with unit tests. The full breakdown is stored on each application and recalculated when the candidate's profile or the job's requirements change.
- [x] Endpoints: apply, my applications, list by job, change stage, notes, résumé download, and match and applied flags in job search
- [x] Résumé upload: size limit, PDF/DOCX file-signature check, random stored filename, separate `uploads` Docker volume, served only to the owner and to recruiters at the company that received the application
- [x] Candidate profile form and résumé upload in candidate Settings (needed for ATS; the rest of Settings comes in Phase 5)
- [x] Frontend: the apply dialog in Find Jobs, with the candidate's match score and matched/missing skills
- [x] Frontend: port `CandidatePipeline.tsx` with native drag and drop and a "Move to" dropdown (no `react-dnd`); optimistic updates roll back on error
- [x] Frontend: candidate page `/recruiter/applications/:id` (profile, ATS breakdown, stage, notes, timeline, résumé) and `ATSScreening.tsx`
- [x] Frontend: port `CandidateDashboard.tsx` (stats, my applications with progress, detail dialog with activity)

### Phase 4: AI mock interviews (3–4 days)
- [ ] `backend/app/ai/`: provider protocol, `GeminiProvider`, `FakeProvider`, prompts and Pydantic output schemas
- [ ] Mock interview models and migration, service and controller
- [ ] Static fallback question bank, built from the Figma `MockInterview.tsx` data
- [ ] Daily rate limit for each candidate
- [ ] Tests that use `FakeProvider`: start a session, answer, complete, check the rate limit, and check that provider failure falls back correctly
- [ ] Frontend: port `MockInterview.tsx` with a loading state while the AI evaluates, and a session history list on the candidate dashboard
- [ ] An optional "Practice for this job" button on job cards and application details

### Phase 5: Dashboards and settings (2 days)
- [ ] `/recruiter/stats` and `/candidate/stats`, computed with SQL aggregates
- [ ] Port `RecruiterDashboard.tsx` (recharts) and wire it to the stats
- [ ] Port `Settings.tsx`, keeping only the profile, resume, company info and change-password tabs. Hide billing, 2FA and notification settings, or show them as "coming soon".

### Phase 6: Nice to have (if time allows)
- [ ] Scheduled interviews on the candidate profile ("Schedule Interview" dialog)
- [ ] Email notifications for stage changes, through a free SMTP tier such as Brevo, or Mailpit locally
- [ ] AI resume feedback: extract text with `pypdf`, then use the same LLM provider (listed under Future Enhancements in the design document)
- [ ] Seed script with demo recruiters, jobs and candidates for presentations
- [ ] Playwright end-to-end smoke test of the main flows

### Phase 7: Deployment (optional)
- [ ] The design document targets AWS (EC2 Auto Scaling Group and RDS MySQL). The AWS Free Tier can host a single small EC2 instance and a micro RDS instance.
- [ ] A cheaper or simpler option is one VM running `docker compose`, with MySQL in a container.
- [ ] Store secrets (`SECRET_KEY`, `LLM_API_KEY`, the database password) as GitHub Actions secrets or environment variables, never in the repo.

---

## 8. Testing strategy

- **Backend:** pytest with SQLite, as now. Each endpoint gets tests for the success path, auth (401), role (403), ownership (403/404) and validation (422). The ATS scoring and the AI output parsing get pure unit tests.
- **AI:** CI always uses `FakeProvider`. A manual script (`scripts/try_llm.py`) checks the real provider with your own API key.
- **Frontend:** `npm run lint` and `npm run build` in CI. Vitest can be added for hooks and utilities if time allows.

---

## 9. Decisions to confirm

The defaults below are what this plan assumes. Change them here if you want something different.

| Decision | Default in this plan |
|---|---|
| Pipeline stages | The Figma set (6 stages including **Technical**) plus a **Rejected** state. The design document lists 5. |
| LLM provider | Gemini free tier, with Groq or Ollama available through the same interface |
| Company model | One company per recruiter, created on the recruiter's first job or in settings. No multi-recruiter teams yet. |
| Public job board | `GET /jobs` works without logging in, but applying requires a candidate account |
| Billing, 2FA, notifications | Out of scope for the MVP. The UI is hidden or marked "coming soon". |
