"""Steps 3-4 - symbol interleaving and 16x16 tile frame construction."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np

from ..core.interleaver import deinterleave, interleave
from ..core.layout import DEFAULT_LAYOUT, TileLayout
from .bits import bits_to_bytes, bytes_to_bits, int_to_bits


@dataclass(frozen=True)
class EncodedTile:
    matrix: np.ndarray        # (G, G) uint8, 1 = render a dot
    roles: np.ndarray         # (G, G) int8 CellRole map
    codeword: list[int]       # RS codeword before interleaving
    interleaved: list[int]    # symbol order as laid out in the tile


def _place(matrix: np.ndarray, cells: Sequence[tuple[int, int]], bits: Sequence[int]) -> None:
    if cells:
        rows, cols = zip(*cells)
        matrix[list(rows), list(cols)] = bits


def build_tile_matrix(codeword: Sequence[int], layout: TileLayout = DEFAULT_LAYOUT) -> EncodedTile:
    cfg = layout.config
    if len(codeword) != cfg.n_symbols:
        raise ValueError(f"codeword has {len(codeword)} symbols, expected {cfg.n_symbols}")

    interleaved = interleave(list(codeword), cfg.interleave_prime)
    data_bits = bytes_to_bits(interleaved)

    matrix = np.zeros((cfg.grid_size, cfg.grid_size), dtype=np.uint8)
    _place(matrix, layout.data_cells, data_bits)
    _place(matrix, layout.repeat_cells, data_bits[: len(layout.repeat_cells)])
    _place(matrix, layout.meta_cells, int_to_bits(cfg.tile_version, cfg.meta_bits))
    _place(matrix, layout.control_cells, cfg.control)
    # RESERVED cells stay 0 and are never rendered.

    return EncodedTile(
        matrix=matrix,
        roles=layout.roles.copy(),
        codeword=list(codeword),
        interleaved=interleaved,
    )


def read_tile_matrix(matrix: np.ndarray, layout: TileLayout = DEFAULT_LAYOUT) -> list[int]:
    """Hard-decision inverse of :func:`build_tile_matrix` (self-check / tests)."""
    cfg = layout.config
    rows, cols = zip(*layout.data_cells)
    bits = np.asarray(matrix)[list(rows), list(cols)]
    return deinterleave(list(bits_to_bytes(bits)), cfg.interleave_prime)
