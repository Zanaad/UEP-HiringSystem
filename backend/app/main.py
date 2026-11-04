from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.exceptions import ConflictError, NotFoundError, RateLimitError
from app.routes.account_routes import router as account_router
from app.routes.application_routes import router as application_router
from app.routes.auth_routes import router as auth_router
from app.routes.job_routes import router as job_router
from app.routes.mock_interview_routes import router as mock_interview_router
from app.routes.profile_routes import router as profile_router
from app.routes.stats_routes import router as stats_router
from app.routes.user_routes import router as user_router

app = FastAPI(title="UEP Hiring System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def not_found_handler(_: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
def conflict_handler(_: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(RateLimitError)
def rate_limit_handler(_: Request, exc: RateLimitError) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": str(exc)})


app.include_router(auth_router)
app.include_router(user_router)
app.include_router(job_router)
app.include_router(profile_router)
app.include_router(application_router)
app.include_router(mock_interview_router)
app.include_router(account_router)
app.include_router(stats_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "UEP Hiring System API is running"}
