import pytest

from forensic_steganography.core.interleaver import deinterleave, deinterleave_positions, interleave


def test_matches_spec_order():
    out = interleave(list(range(28)), 5)
    assert out[:7] == [0, 5, 10, 15, 20, 25, 2]
    assert sorted(out) == list(range(28))


def test_round_trip():
    data = [(i * 37) % 256 for i in range(28)]
    assert deinterleave(interleave(data, 5), 5) == data


def test_rejects_non_coprime_stride():
    with pytest.raises(ValueError):
        interleave(list(range(28)), 7)


def test_burst_is_dispersed():
    # 4 adjacent damaged symbols in the tile land on non-adjacent codeword symbols.
    hit = deinterleave_positions([10, 11, 12, 13], 28, 5)
    assert len(set(hit)) == 4
    assert all(b - a > 1 for a, b in zip(hit, hit[1:]))


def test_deinterleave_positions_consistent():
    data = list(range(28))
    shuffled = interleave(data, 5)
    positions = [0, 6, 13, 27]
    assert deinterleave_positions(positions, 28, 5) == sorted(shuffled[p] for p in positions)
