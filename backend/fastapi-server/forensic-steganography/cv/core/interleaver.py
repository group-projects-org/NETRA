"""Deterministic symbol-level block interleaver.

Physical damage (pen strokes, stains, folds) produces spatially contiguous
burst errors. Interleaving spreads adjacent cells across distant
Reed-Solomon symbols so a burst becomes several isolated symbol errors.

    out[k] = in[(k * p) mod N]      with gcd(p, N) == 1
"""

from __future__ import annotations

from math import gcd
from typing import Sequence, TypeVar

T = TypeVar("T")


def permutation(n: int, p: int) -> list[int]:
    """Source index for every output position."""
    if gcd(p, n) != 1:
        raise ValueError(f"stride {p} must be coprime with length {n}")
    return [(k * p) % n for k in range(n)]


def interleave(symbols: Sequence[T], p: int) -> list[T]:
    perm = permutation(len(symbols), p)
    return [symbols[src] for src in perm]


def deinterleave(symbols: Sequence[T], p: int) -> list[T]:
    perm = permutation(len(symbols), p)
    out: list[T] = [None] * len(symbols)  # type: ignore[list-item]
    for k, src in enumerate(perm):
        out[src] = symbols[k]
    return out


def deinterleave_positions(positions: Sequence[int], n: int, p: int) -> list[int]:
    """Map erasure positions in the interleaved stream back to codeword indices."""
    perm = permutation(n, p)
    return sorted(perm[k] for k in positions)
