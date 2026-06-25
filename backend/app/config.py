"""Backend configuration. See DESIGN.md §5, §6.

Loopback-only HTTP server. Paths default to per-user locations; everything is
overridable via environment variables (prefix ``CRATEDIG_DESKTOP_``) or a local
``.env`` file. ``pydantic-settings`` comes in transitively via ``cratedig``.
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_data_dir() -> Path:
    # Windows: %APPDATA%/cratedig-desktop ; otherwise ~/.local/share/cratedig-desktop
    base = os.environ.get("APPDATA") or str(Path.home() / ".local" / "share")
    return Path(base) / "cratedig-desktop"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CRATEDIG_DESKTOP_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    host: str = "127.0.0.1"
    port: int = 8008
    data_dir: Path = Field(default_factory=_default_data_dir)
    output_dir: Path = Field(default_factory=lambda: Path.home() / "Music" / "cratedig")

    @property
    def db_path(self) -> Path:
        return self.data_dir / "library.db"


settings = Settings()
