"""Central configuration for the forensic steganography pipeline.

Every geometric and coding parameter shared by the encoder, vision stage and
decoder lives here, so all sides are guaranteed to agree on the format.

The HMAC key is read from ``NETRA_STEG_SECRET``. If that is not already set in
the environment, it is loaded from the nearest ``.env`` file: first searching
upward from the current directory, then upward from this package (which finds
``backend/.env``). Variables that are already set are never overwritten.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from math import gcd
from pathlib import Path

from .errors import ConfigError

SECRET_ENV_VAR = "NETRA_STEG_SECRET"
MIN_SECRET_BYTES = 16


@dataclass(frozen=True)
class StegConfig:
    # --- Coding -----------------------------------------------------------
    grid_size: int = 16                  # tile is grid_size x grid_size cells
    payload_len: int = 16                # ASCII payload bytes (NUL padded)
    tag_len: int = 4                     # truncated HMAC-SHA256 tag bytes
    rs_nsym: int = 8                     # Reed-Solomon parity symbols
    interleave_prime: int = 5            # symbol interleaver stride p
    tile_version: int = 1                # encoded in the 4 META cells
    meta_bits: int = 4
    control: tuple[int, ...] = (1, 0, 1, 1)

    # --- Geometry (PDF points, 1 pt = 1/72 in) ---------------------------
    pitch_pt: float = 2.4                # centre-to-centre cell spacing
    dot_r: float = 0.4                   # data dot radius (0.14 mm)
    pilot_r: float = 0.6                 # pilot dot radius
    tile_gap_pt: float = 4.8             # empty spacing between adjacent tiles
    page_margin_pt: float = 18.0         # printer-safe margin (0.25 in)
    text_pad_pt: float = 3.0             # safety border around content boxes
    p4_reserve_pitch: float = 0.75       # cells closer than this to P4 are reserved
    # Drawings larger than this fraction of the page (page backgrounds,
    # full-page frames) are not treated as obstacles.
    ignore_drawing_area_frac: float = 0.5
    # Scanned pages: a raster covering more than ignore_drawing_area_frac of
    # the page is not an obstacle as a whole; its ink is located from pixels.
    raster_dpi: int = 100                # resolution of the ink analysis
    raster_ink_frac: float = 0.7         # darker than 70% of paper white = ink
    raster_join_pt: float = 3.0          # glyphs closer than this merge into one box

    # Pilot constellation in normalised tile space (x right, y down).
    pilots: tuple[tuple[float, float], ...] = (
        (0.0, 0.0),    # P1
        (1.0, 0.0),    # P2
        (0.0, 1.0),    # P3
        (0.73, 0.61),  # P4 - asymmetric fingerprint
    )

    # --- Ink --------------------------------------------------------------
    color_cmyk: tuple[float, float, float, float] = (0.0, 0.0, 1.0, 0.0)
    debug_color_rgb: tuple[float, float, float] = (1.0, 0.0, 1.0)
    debug_radius_scale: float = 2.0

    def __post_init__(self) -> None:
        if gcd(self.interleave_prime, self.n_symbols) != 1:
            raise ConfigError(
                f"interleave_prime={self.interleave_prime} is not coprime "
                f"with codeword length {self.n_symbols}"
            )
        if not 0 <= self.tile_version < 2 ** self.meta_bits:
            raise ConfigError(f"tile_version must fit in {self.meta_bits} bits")
        if self.n_data_bits + self.meta_bits + len(self.control) > self.n_cells:
            raise ConfigError(
                f"{self.n_data_bits} data bits do not fit in a "
                f"{self.grid_size}x{self.grid_size} tile"
            )
        if 2 * self.dot_r >= self.pitch_pt:
            raise ConfigError("dots would touch: 2*dot_r must be < pitch_pt")

    # --- Derived quantities ----------------------------------------------
    @property
    def packet_len(self) -> int:
        return self.payload_len + self.tag_len

    @property
    def n_symbols(self) -> int:
        return self.packet_len + self.rs_nsym

    @property
    def n_data_bits(self) -> int:
        return self.n_symbols * 8

    @property
    def n_cells(self) -> int:
        return self.grid_size * self.grid_size

    @property
    def tile_size_pt(self) -> float:
        """Side length of the pilot frame (pilots sit on its corners)."""
        return (self.grid_size + 1) * self.pitch_pt

    @property
    def tile_step_pt(self) -> float:
        return self.tile_size_pt + self.tile_gap_pt


DEFAULT_CONFIG = StegConfig()


def find_env_file() -> Path | None:
    """Nearest ``.env`` above the current directory, else above this package."""
    for start in (Path.cwd(), Path(__file__).resolve().parent):
        for folder in (start, *start.parents):
            candidate = folder / ".env"
            if candidate.is_file():
                return candidate
    return None


def load_env() -> Path | None:
    """Load the nearest ``.env`` without overriding variables already set."""
    path = find_env_file()
    if path is not None:
        from dotenv import load_dotenv

        load_dotenv(path, override=False)
    return path


def resolve_secret(secret: str | bytes | None = None) -> bytes:
    """Return the HMAC key: explicit override, else env var, else ``.env``."""
    if secret is None:
        secret = os.environ.get(SECRET_ENV_VAR)
        if not secret:
            load_env()
            secret = os.environ.get(SECRET_ENV_VAR)
        if not secret:
            raise ConfigError(
                f"No secret supplied and {SECRET_ENV_VAR} is not set "
                f"(add it to backend/.env; see backend/.env.example)"
            )
    key = secret.encode("utf-8") if isinstance(secret, str) else bytes(secret)
    if len(key) < MIN_SECRET_BYTES:
        raise ConfigError(f"Secret key must be at least {MIN_SECRET_BYTES} bytes")
    return key
