"""Tile geometry and cell-role map, shared by the encoder and decoder.

Tile frame (normalised coordinates, x right / y down)::

    P1 (0,0) ●───────────────────────● P2 (1,0)
             │ M M M M . . . . . . . │
             │ . . . . . . . . . . . │
             │ . . . . D A T A . . . │
             │ . . . . . . . ●P4 . . │   P4 = (0.73, 0.61)
             │ . . . . . . . . . . . │
             │ . . . . . . . . C C C C
    P3 (0,1) ●───────────────────────┘   (no pilot at (1,1))

The 16x16 cell lattice sits strictly inside the pilot frame: cell (r, c) is
centred at ((c + 1) * pitch, (r + 1) * pitch) from P1, so the frame is
(grid + 1) * pitch wide and the three corner pilots never touch a cell.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import IntEnum
from functools import cached_property

import numpy as np

from .config import DEFAULT_CONFIG, StegConfig
from .errors import ConfigError


class CellRole(IntEnum):
    DATA = 0
    META = 1
    CONTROL = 2
    RESERVED = 3  # never rendered (keeps clear of pilot P4)
    REPEAT = 4    # redundant copy of the leading data bits


Cell = tuple[int, int]


@dataclass(frozen=True)
class TileLayout:
    config: StegConfig = DEFAULT_CONFIG

    # --- Geometry ----------------------------------------------------------
    @cached_property
    def cell_offsets_pt(self) -> np.ndarray:
        """(G, G, 2) array of cell centres relative to P1, in points."""
        g, pitch = self.config.grid_size, self.config.pitch_pt
        idx = (np.arange(g) + 1) * pitch
        xs, ys = np.meshgrid(idx, idx)  # xs varies along columns
        return np.stack([xs, ys], axis=-1)

    @cached_property
    def pilot_offsets_pt(self) -> np.ndarray:
        """(4, 2) array of pilot centres relative to P1, in points."""
        return np.asarray(self.config.pilots, dtype=float) * self.config.tile_size_pt

    # --- Roles -------------------------------------------------------------
    @cached_property
    def meta_cells(self) -> list[Cell]:
        return [(0, c) for c in range(self.config.meta_bits)]

    @cached_property
    def control_cells(self) -> list[Cell]:
        g, n = self.config.grid_size, len(self.config.control)
        return [(g - 1, c) for c in range(g - n, g)]

    @cached_property
    def reserved_cells(self) -> list[Cell]:
        cfg = self.config
        p4 = self.pilot_offsets_pt[3]
        dist = np.linalg.norm(self.cell_offsets_pt - p4, axis=-1)
        rows, cols = np.nonzero(dist < cfg.p4_reserve_pitch * cfg.pitch_pt)
        return sorted(zip(rows.tolist(), cols.tolist()))

    @cached_property
    def roles(self) -> np.ndarray:
        """(G, G) int8 role map; DATA/REPEAT assigned in row-major order."""
        cfg = self.config
        g = cfg.grid_size
        roles = np.full((g, g), -1, dtype=np.int8)
        for cell in self.meta_cells:
            roles[cell] = CellRole.META
        for cell in self.control_cells:
            roles[cell] = CellRole.CONTROL
        for cell in self.reserved_cells:
            if roles[cell] != -1:
                raise ConfigError(f"P4 reservation overlaps structural cell {cell}")
            roles[cell] = CellRole.RESERVED

        free = [(r, c) for r in range(g) for c in range(g) if roles[r, c] == -1]
        if len(free) < cfg.n_data_bits:
            raise ConfigError(
                f"only {len(free)} free cells for {cfg.n_data_bits} data bits"
            )
        for i, cell in enumerate(free):
            roles[cell] = CellRole.DATA if i < cfg.n_data_bits else CellRole.REPEAT
        return roles

    def _cells_with(self, role: CellRole) -> list[Cell]:
        rows, cols = np.nonzero(self.roles == role)  # row-major order
        return list(zip(rows.tolist(), cols.tolist()))

    @cached_property
    def data_cells(self) -> list[Cell]:
        """Cell for data bit i (MSB-first bit stream of the interleaved codeword)."""
        return self._cells_with(CellRole.DATA)

    @cached_property
    def repeat_cells(self) -> list[Cell]:
        """repeat_cells[i] carries a copy of data bit i."""
        return self._cells_with(CellRole.REPEAT)

    def role_counts(self) -> dict[CellRole, int]:
        return {role: int(np.count_nonzero(self.roles == role)) for role in CellRole}


DEFAULT_LAYOUT = TileLayout()
