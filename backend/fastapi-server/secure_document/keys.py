"""Key-provider abstraction; integrate with a KMS/HSM in production."""

from __future__ import annotations

from typing import Protocol


class KeyProvider(Protocol):
    def get_document_key(self, document_id: str) -> bytes:
        """Return a 32-byte AES key authorized for this document."""


class StaticKeyProvider:
    """Test/demo provider only. Never use static keys in production."""

    def __init__(self, key: bytes):
        if len(key) != 32:
            raise ValueError("AES-256 requires a 32-byte key")
        self._key = key

    def get_document_key(self, document_id: str) -> bytes:
        if not document_id:
            raise ValueError("document_id is required")
        return self._key
