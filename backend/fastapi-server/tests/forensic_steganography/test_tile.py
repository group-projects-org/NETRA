import numpy as np

from forensic_steganography.core.layout import DEFAULT_LAYOUT as L
from forensic_steganography.core.layout import CellRole
from forensic_steganography.encoder.bits import bits_to_bytes, bytes_to_bits, int_to_bits
from forensic_steganography.encoder.fec import rs_encode
from forensic_steganography.encoder.payload import build_packet
from forensic_steganography.encoder.tile import build_tile_matrix, read_tile_matrix

from .conftest import SPEC_PAYLOAD, TEST_SECRET


def _tile():
    cw = rs_encode(build_packet(SPEC_PAYLOAD, TEST_SECRET.encode()), 8)
    return cw, build_tile_matrix(cw)


def test_bits_msb_first():
    assert bytes_to_bits([0xA5]).tolist() == [1, 0, 1, 0, 0, 1, 0, 1]
    assert bits_to_bytes([1, 0, 1, 0, 0, 1, 0, 1]) == b"\xa5"
    assert int_to_bits(1, 4) == [0, 0, 0, 1]


def test_round_trip():
    cw, tile = _tile()
    assert tile.matrix.shape == (16, 16)
    assert tile.matrix.dtype == np.uint8
    assert read_tile_matrix(tile.matrix) == cw


def test_structural_cells():
    _, tile = _tile()
    m = tile.matrix
    assert [m[c] for c in L.control_cells] == [1, 0, 1, 1]
    assert [m[c] for c in L.meta_cells] == [0, 0, 0, 1]
    assert (m[L.roles == CellRole.RESERVED] == 0).all()


def test_repeat_cells_mirror_leading_data_bits():
    _, tile = _tile()
    m = tile.matrix
    for i, cell in enumerate(L.repeat_cells):
        assert m[cell] == m[L.data_cells[i]]


def test_tile_differs_per_payload():
    key = TEST_SECRET.encode()
    a = build_tile_matrix(rs_encode(build_packet("CID1007", key), 8)).matrix
    b = build_tile_matrix(rs_encode(build_packet("CID1008", key), 8)).matrix
    assert (a != b).any()
