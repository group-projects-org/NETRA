"""Step 5b - tiling engine with active collision avoidance.

The tile is replicated over the printable area at steps (dX, dY). Any cell or
pilot whose dot would intersect a padded obstacle box is suppressed (not
rendered). The decoder sees suppressed cells as erasures, which
Reed-Solomon corrects at half the cost of an unknown error.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from ..core.layout import DEFAULT_LAYOUT, CellRole, TileLayout

_CHUNK = 8192  # bounds the (points x boxes) boolean matrix at ~8k x M


def tile_origins(width: float, height: float, layout: TileLayout = DEFAULT_LAYOUT) -> np.ndarray:
    """P1 positions of every whole tile that fits inside the page margins, centred."""
    cfg = layout.config
    size, step, margin = cfg.tile_size_pt, cfg.tile_step_pt, cfg.page_margin_pt
    pilot_pad = cfg.pilot_r  # keep pilot discs inside the margin too

    def axis(extent: float) -> np.ndarray:
        usable = extent - 2 * (margin + pilot_pad)
        if usable < size:
            return np.empty(0)
        n = int((usable - size) // step) + 1
        span = size + (n - 1) * step
        start = margin + pilot_pad + (usable - span) / 2
        return start + np.arange(n) * step

    xs, ys = axis(width), axis(height)
    gx, gy = np.meshgrid(xs, ys)
    return np.column_stack([gx.ravel(), gy.ravel()])


def collides(points: np.ndarray, boxes: np.ndarray, radius: float) -> np.ndarray:
    """Vectorised disc-vs-box test (box grown by ``radius``); returns (P,) bool."""
    hit = np.zeros(len(points), dtype=bool)
    if len(points) == 0 or len(boxes) == 0:
        return hit
    x0, y0, x1, y1 = (boxes[:, i][None, :] for i in range(4))
    for start in range(0, len(points), _CHUNK):
        chunk = points[start:start + _CHUNK]
        px, py = chunk[:, 0:1], chunk[:, 1:2]
        inside = (
            (px >= x0 - radius) & (px <= x1 + radius)
            & (py >= y0 - radius) & (py <= y1 + radius)
        )
        hit[start:start + _CHUNK] = inside.any(axis=1)
    return hit


@dataclass
class PagePlan:
    origins: np.ndarray                 # (T, 2) tile P1 positions
    dots: np.ndarray                    # (N, 2) data/meta/control dot centres to draw
    pilots: np.ndarray                  # (Q, 2) pilot centres to draw
    cell_visible: np.ndarray = field(repr=False)   # (T, G, G) bool
    pilot_visible: np.ndarray = field(repr=False)  # (T, 4) bool
    self_decodable: np.ndarray = field(repr=False) # (T,) bool

    @property
    def n_tiles(self) -> int:
        return len(self.origins)

    @property
    def cells_suppressed(self) -> int:
        return int(self.cell_visible.size - self.cell_visible.sum())

    @property
    def intact_tiles(self) -> int:
        return int(np.sum(self.cell_visible.all(axis=(1, 2)) & self.pilot_visible.all(axis=1)))


def _self_decodable(cell_visible: np.ndarray, pilot_visible: np.ndarray, layout: TileLayout) -> np.ndarray:
    """A tile is self-decodable if, on its own, RS can recover the codeword from it.

    A data bit survives if its primary cell or its REPEAT copy is visible.
    Any lost bit erases its whole symbol; the tile is recoverable when the
    number of erased symbols is <= rs_nsym and its pilots and control cells
    are all visible.
    """
    cfg = layout.config
    g = cfg.grid_size
    flat = cell_visible.reshape(len(cell_visible), g * g)

    data_idx = np.array([r * g + c for r, c in layout.data_cells])
    bit_ok = flat[:, data_idx].copy()
    if layout.repeat_cells:
        rep_idx = np.array([r * g + c for r, c in layout.repeat_cells])
        bit_ok[:, : len(rep_idx)] |= flat[:, rep_idx]

    symbol_ok = bit_ok.reshape(len(flat), cfg.n_symbols, 8).all(axis=2)
    erased = cfg.n_symbols - symbol_ok.sum(axis=1)

    ctrl_idx = np.array([r * g + c for r, c in layout.control_cells])
    return (erased <= cfg.rs_nsym) & flat[:, ctrl_idx].all(axis=1) & pilot_visible.all(axis=1)


def plan_page(
    width: float,
    height: float,
    tile_matrix: np.ndarray,
    obstacles: np.ndarray,
    layout: TileLayout = DEFAULT_LAYOUT,
) -> PagePlan:
    cfg = layout.config
    g = cfg.grid_size
    origins = tile_origins(width, height, layout)
    t = len(origins)

    # Candidate positions for every cell of every tile: (T, G*G, 2).
    cell_pts = origins[:, None, :] + layout.cell_offsets_pt.reshape(1, g * g, 2)
    pilot_pts = origins[:, None, :] + layout.pilot_offsets_pt[None, :, :]

    cell_hit = collides(cell_pts.reshape(-1, 2), obstacles, cfg.dot_r).reshape(t, g, g)
    pilot_hit = collides(pilot_pts.reshape(-1, 2), obstacles, cfg.pilot_r).reshape(t, -1)

    reserved = layout.roles == CellRole.RESERVED
    cell_visible = ~cell_hit & ~reserved[None]
    # Reserved cells are never data-bearing; count them as "visible" so they
    # do not inflate suppression statistics.
    cell_visible_stats = cell_visible | reserved[None]

    draw = cell_visible & (tile_matrix.astype(bool) & ~reserved)[None]
    dots = cell_pts.reshape(t, g, g, 2)[draw]
    pilots = pilot_pts[~pilot_hit]

    return PagePlan(
        origins=origins,
        dots=dots.reshape(-1, 2),
        pilots=pilots.reshape(-1, 2),
        cell_visible=cell_visible_stats,
        pilot_visible=~pilot_hit,
        self_decodable=_self_decodable(cell_visible_stats, ~pilot_hit, layout),
    )
