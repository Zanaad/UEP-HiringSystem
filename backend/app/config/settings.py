from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "HirePrep"
    debug: bool = True
    database_url: str = Field(
        default="mysql+pymysql://root:password@localhost:3306/hireprep"
    )


settings = Settings()