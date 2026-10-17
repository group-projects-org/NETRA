"""Backwards-compatible entry point; configuration lives in ``cv.core.config``."""

from .core.config import DEFAULT_CONFIG, SECRET_ENV_VAR, StegConfig, resolve_secret

__all__ = ["DEFAULT_CONFIG", "SECRET_ENV_VAR", "StegConfig", "resolve_secret"]
