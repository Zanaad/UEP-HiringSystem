from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "HirePrep"
    debug: bool = True


settings = Settings()