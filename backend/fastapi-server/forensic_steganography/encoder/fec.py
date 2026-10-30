"""Step 2 - Reed-Solomon forward error correction over GF(2^8).

A systematic RS(n, k) code with ``rs_nsym`` parity symbols corrects E errors
and R erasures whenever 2E + R <= rs_nsym. Default: RS(28, 20), 8 parity.
"""

from __future__ import annotations

from functools import lru_cache

from reedsolo import RSCodec


@lru_cache(maxsize=8)
def rs_codec(nsym: int) -> RSCodec:
    # Standard parameters: primitive polynomial 0x11d, generator alpha = 2, fcr = 0.
    return RSCodec(nsym)


def rs_encode(packet: bytes, nsym: int) -> list[int]:
    """Return the systematic codeword ``packet || parity`` as GF(2^8) symbols."""
    return list(rs_codec(nsym).encode(bytes(packet)))
