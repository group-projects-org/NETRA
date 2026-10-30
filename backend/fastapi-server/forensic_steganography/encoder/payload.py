"""Step 1 - payload serialisation and HMAC authentication.

    Tag    = HMAC-SHA256(K_secret, Payload) mod 2^32
    Packet = Payload || Tag                       (16 + 4 = 20 bytes)
"""

from __future__ import annotations

import hashlib
import hmac

from ..core.config import DEFAULT_CONFIG, StegConfig
from ..core.errors import PayloadError

PAD_BYTE = b"\x00"


def serialize_payload(text: str, config: StegConfig = DEFAULT_CONFIG) -> bytes:
    """Validate a printable-ASCII string and NUL-pad it to ``payload_len`` bytes."""
    if not isinstance(text, str):
        raise PayloadError(f"payload must be str, got {type(text).__name__}")
    if not text:
        raise PayloadError("payload must not be empty")
    if len(text) > config.payload_len:
        raise PayloadError(
            f"payload is {len(text)} chars; maximum is {config.payload_len}"
        )
    bad = [ch for ch in text if not 0x20 <= ord(ch) <= 0x7E]
    if bad:
        raise PayloadError(f"payload contains non-printable-ASCII characters: {bad!r}")
    return text.encode("ascii").ljust(config.payload_len, PAD_BYTE)


def compute_tag(key: bytes, payload: bytes, config: StegConfig = DEFAULT_CONFIG) -> bytes:
    """HMAC-SHA256 reduced mod 2^(8*tag_len), i.e. the low-order (last) bytes, big-endian."""
    digest = hmac.new(key, payload, hashlib.sha256).digest()
    tag_int = int.from_bytes(digest, "big") % (1 << (8 * config.tag_len))
    return tag_int.to_bytes(config.tag_len, "big")


def build_packet(text: str, key: bytes, config: StegConfig = DEFAULT_CONFIG) -> bytes:
    payload = serialize_payload(text, config)
    return payload + compute_tag(key, payload, config)
