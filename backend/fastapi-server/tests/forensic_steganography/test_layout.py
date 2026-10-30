import numpy as np
import pytest

from forensic_steganography.core.config import ConfigError, StegConfig
from forensic_steganography.core.layout import DEFAULT_LAYOUT as L
from forensic_steganography.core.layout import CellRole


def test_role_budget():
    counts = L.role_counts()
    assert counts[CellRole.DATA] == 224
    assert counts[CellRole.META] == 4
    assert counts[CellRole.CONTROL] == 4
    assert counts[CellRole.RESERVED] + counts[CellRole.REPEAT] == 24
    assert sum(counts.values()) == 256
    assert (L.roles >= 0).all()


def test_cell_lists_match_role_map():
    assert len(L.data_cells) == 224
    assert len(set(L.data_cells)) == 224
    assert all(L.roles[c] == CellRole.DATA for c in L.data_cells)
    assert all(L.roles[c] == CellRole.REPEAT for c in L.repeat_cells)


def test_pilot_constellation():
    size = L.config.tile_size_pt
    np.testing.assert_allclose(
        L.pilot_offsets_pt,
        [[0, 0], [size, 0], [0, size], [0.73 * size, 0.61 * size]],
    )


def test_no_rendered_cell_near_p4():
    cfg = L.config
    dist = np.linalg.norm(L.cell_offsets_pt - L.pilot_offsets_pt[3], axis=-1)
    near = dist < cfg.p4_reserve_pitch * cfg.pitch_pt
    assert near.any()
    assert (L.roles[near] == CellRole.RESERVED).all()


def test_cells_strictly_inside_frame():
    size = L.config.tile_size_pt
    assert L.cell_offsets_pt.min() > 0
    assert L.cell_offsets_pt.max() < size


def test_14x14_grid_is_rejected():
    with pytest.raises(ConfigError):
        StegConfig(grid_size=14)


def test_non_coprime_interleaver_is_rejected():
    with pytest.raises(ConfigError):
        StegConfig(interleave_prime=7)
