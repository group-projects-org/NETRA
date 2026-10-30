import random

import pytest
from reedsolo import ReedSolomonError

from forensic_steganography.encoder.fec import rs_codec, rs_encode

PACKET = bytes(range(65, 85))  # 20 bytes


def test_codeword_is_systematic_28_symbols():
    cw = rs_encode(PACKET, 8)
    assert len(cw) == 28
    assert all(isinstance(s, int) and 0 <= s < 256 for s in cw)
    assert bytes(cw[:20]) == PACKET


@pytest.mark.parametrize("seed", range(20))
def test_corrects_four_errors(seed):
    rng = random.Random(seed)
    cw = rs_encode(PACKET, 8)
    for pos in rng.sample(range(28), 4):
        cw[pos] ^= rng.randrange(1, 256)
    assert bytes(rs_codec(8).decode(bytes(cw))[0]) == PACKET


@pytest.mark.parametrize("seed", range(20))
def test_corrects_eight_erasures(seed):
    rng = random.Random(seed)
    cw = rs_encode(PACKET, 8)
    erased = rng.sample(range(28), 8)
    for pos in erased:
        cw[pos] = 0
    assert bytes(rs_codec(8).decode(bytes(cw), erase_pos=erased)[0]) == PACKET


def test_mixed_errors_and_erasures_within_bound():
    # 2E + R = 2*2 + 4 = 8 <= nsym
    cw = rs_encode(PACKET, 8)
    for pos in (1, 9):
        cw[pos] ^= 0x5A
    erased = [3, 14, 20, 27]
    for pos in erased:
        cw[pos] = 0
    assert bytes(rs_codec(8).decode(bytes(cw), erase_pos=erased)[0]) == PACKET


def test_nine_erasures_exceed_capacity():
    cw = rs_encode(PACKET, 8)
    with pytest.raises(ReedSolomonError):
        rs_codec(8).decode(bytes(cw), erase_pos=list(range(9)))
