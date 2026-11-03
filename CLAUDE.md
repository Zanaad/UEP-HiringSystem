# CLAUDE.md

HirePrep: a hiring platform with a recruiter side and a candidate side. The backend is FastAPI with SQLAlchemy, Alembic and MySQL in `backend/`. The frontend is React, Vite and TypeScript in `frontend/`. The roadmap is in [PLAN.md](PLAN.md). The Figma design export is in `~/Downloads/HirePrep SaaS Web Platform/`.

## Rules

1. **No needless files.** Only create a new file when it is genuinely needed or will actually be reused. Don't split code into extra modules, helpers or abstractions just for "reusability".
2. **Keep backend tests minimal.** Test logic and functionality that must not break: auth and permissions, ATS scoring, application and pipeline rules, AI output handling. Don't write tests for small or trivial changes.
3. **Few comments.** Don't write comments that explain the code in detail. When a comment is needed, keep it to 1–2 lines.
4. **Clean code and best practices.** Follow the existing structure (`routes → controllers → services → repositories → models`) and the conventions already in the codebase.
5. **Performance.** Always aim for optimised code. Avoid N+1 queries, use joins and eager loading where appropriate, paginate lists, add indexes for columns used in filters, and avoid unnecessary re-renders and refetches on the frontend.
6. **Security.** Check every change for security issues: authentication and role/ownership checks, input validation, safe file uploads, no SQL built from strings, no secrets in logs.
7. **Never commit sensitive data.** Secrets, API keys and passwords live only in `.env`, which is gitignored. Add placeholders to `.env.example` and never put real values in code, config or docs.
8. **Never commit or push.** Claude does not run `git commit` or `git push`. When there is enough work for a commit, tell the user and suggest a commit message. The user commits.
