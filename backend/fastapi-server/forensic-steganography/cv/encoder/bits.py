"""MSB-first conversion between byte symbols and bit vectors."""

from __future__ import annotations

from typing import Iterable

import numpy as np


def bytes_to_bits(data: Iterable[int] | bytes) -> np.ndarray:
    """[0xA5] -> [1, 0, 1, 0, 0, 1, 0, 1] (uint8)."""
    arr = np.frombuffer(bytes(bytearray(data)), dtype=np.uint8)
    return np.unpackbits(arr)


def bits_to_bytes(bits: Iterable[int] | np.ndarray) -> bytes:
    arr = np.asarray(bits, dtype=np.uint8)
    if arr.size % 8:
        raise ValueError(f"bit count {arr.size} is not a multiple of 8")
    return np.packbits(arr).tobytes()


def int_to_bits(value: int, width: int) -> list[int]:
    if not 0 <= value < (1 << width):
        raise ValueError(f"{value} does not fit in {width} bits")
    return [(value >> (width - 1 - i)) & 1 for i in range(width)]
