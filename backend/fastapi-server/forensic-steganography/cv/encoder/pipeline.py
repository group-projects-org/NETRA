"""End-to-end encoder: ASCII payload + PDF -> watermarked PDF.

    [ASCII] -> [HMAC tag] -> [Reed-Solomon] -> [Interleaver] -> [Tile frame]
            -> [Occupancy map] -> [Adaptive placement] -> [Vector render]
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable

import numpy as np
import pymupdf

from ..core.config import DEFAULT_CONFIG, StegConfig, resolve_secret
from ..core.errors import StegError
from ..core.layout import TileLayout
from .fec import rs_encode
from .occupancy import extract_obstacles, page_extent
from .payload import build_packet
from .placement import plan_page
from .renderer import render_dots
from .tile import build_tile_matrix, read_tile_matrix


@dataclass
class PageReport:
    page: int
    tiles: int
    dots_drawn: int
    pilots_drawn: int
    cells_suppressed: int
    intact_tiles: int
    self_decodable_tiles: int
    # Rendered dot centres, kept for diagnostics/tests; excluded from to_dict().
    dots: np.ndarray = field(default_factory=lambda: np.empty((0, 2)), repr=False)


@dataclass
class EncodeReport:
    payload: str
    codeword_hex: str
    tile_version: int
    debug: bool
    pages: list[PageReport] = field(default_factory=list)

    @property
    def tiles(self) -> int:
        return sum(p.tiles for p in self.pages)

    @property
    def dots_drawn(self) -> int:
        return sum(p.dots_drawn for p in self.pages)

    @property
    def self_decodable_tiles(self) -> int:
        return sum(p.self_decodable_tiles for p in self.pages)

    def to_dict(self) -> dict:
        data = asdict(self)
        for page in data["pages"]:
            page.pop("dots", None)
        data["totals"] = {
            "tiles": self.tiles,
            "dots_drawn": self.dots_drawn,
            "self_decodable_tiles": self.self_decodable_tiles,
        }
        return data


def _open(source: str | Path | bytes) -> pymupdf.Document:
    if isinstance(source, (bytes, bytearray)):
        doc = pymupdf.open(stream=bytes(source), filetype="pdf")
    else:
        doc = pymupdf.open(Path(source))
    if not doc.is_pdf:
        doc.close()
        raise StegError("input is not a PDF document")
    if doc.needs_pass:
        doc.close()
        raise StegError("encrypted PDFs are not supported")
    return doc


def encode_pdf(
    source: str | Path | bytes,
    payload: str,
    *,
    secret: str | bytes | None = None,
    config: StegConfig = DEFAULT_CONFIG,
    debug: bool = False,
    pages: Iterable[int] | None = None,
) -> tuple[bytes, EncodeReport]:
    """Embed ``payload`` as a forensic dot field into every (or selected) page.

    Returns the watermarked PDF bytes and an :class:`EncodeReport`.
    """
    key = resolve_secret(secret)
    layout = TileLayout(config)

    packet = build_packet(payload, key, config)
    codeword = rs_encode(packet, config.rs_nsym)
    tile = build_tile_matrix(codeword, layout)
    if read_tile_matrix(tile.matrix, layout) != codeword:  # cheap self-check
        raise StegError("tile self-check failed: layout is not invertible")

    report = EncodeReport(
        payload=payload,
        codeword_hex=bytes(codeword).hex(),
        tile_version=config.tile_version,
        debug=debug,
    )

    doc = _open(source)
    try:
        indices = range(doc.page_count) if pages is None else list(pages)
        for index in indices:
            page = doc[index]
            width, height = page_extent(page)
            obstacles = extract_obstacles(page, config)
            plan = plan_page(width, height, tile.matrix, obstacles, layout)
            render_dots(page, plan.dots, plan.pilots, config, debug=debug)
            report.pages.append(PageReport(
                page=index,
                tiles=plan.n_tiles,
                dots_drawn=len(plan.dots),
                pilots_drawn=len(plan.pilots),
                cells_suppressed=plan.cells_suppressed,
                intact_tiles=plan.intact_tiles,
                self_decodable_tiles=int(plan.self_decodable.sum()),
                dots=plan.dots,
            ))
        out = doc.tobytes(garbage=3, deflate=True)
    finally:
        doc.close()
    return out, report
