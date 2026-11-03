from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth_routes import router as auth_router
from app.routes.job_routes import router as job_router
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

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(job_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "UEP Hiring System API is running"}
