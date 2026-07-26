from fastapi import FastAPI

from app.routes.user_routes import router as user_router

app = FastAPI(title="UEP Hiring System API")

app.include_router(user_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "UEP Hiring System API is running"}
