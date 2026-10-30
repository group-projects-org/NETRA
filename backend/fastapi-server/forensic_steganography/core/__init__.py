"""Shared primitives used by both the encoder and the decoder."""

from .config import DEFAULT_CONFIG, SECRET_ENV_VAR, StegConfig, resolve_secret
from .errors import ConfigError, PayloadError, StegError
from .interleaver import deinterleave, deinterleave_positions, interleave
from .layout import DEFAULT_LAYOUT, CellRole, TileLayout

__all__ = [
    "DEFAULT_CONFIG",
    "DEFAULT_LAYOUT",
    "SECRET_ENV_VAR",
    "CellRole",
    "ConfigError",
    "PayloadError",
    "StegConfig",
    "StegError",
    "TileLayout",
    "deinterleave",
    "deinterleave_positions",
    "interleave",
    "resolve_secret",
]
