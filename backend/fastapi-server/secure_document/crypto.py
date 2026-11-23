"""Chunked AES-256-GCM container encryption and authenticated decryption."""

from __future__ import annotations

import os
import struct
from pathlib import Path
from typing import BinaryIO, Iterator

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .errors import AuthenticationFailed, InvalidEncryptedDocument

MAGIC = b"NTRASEC1"  # 8 bytes
VERSION = 1
NONCE_PREFIX_SIZE = 8
TAG_SIZE = 16
HEADER_STRUCT = struct.Struct(">8sBI8s")  # magic, version, chunk size, nonce prefix
LENGTH_STRUCT = struct.Struct(">I")
MIN_CHUNK_SIZE = 1024
MAX_CHUNK_SIZE = 4 * 1024 * 1024
DEFAULT_CHUNK_SIZE = 64 * 1024
MAX_CHUNKS = 2**32 - 1


def _validate_key(key: bytes) -> None:
    if not isinstance(key, bytes) or len(key) != 32:
        raise ValueError("AES-256-GCM requires a 32-byte key")


def _make_header(chunk_size: int, nonce_prefix: bytes) -> bytes:
    return HEADER_STRUCT.pack(MAGIC, VERSION, chunk_size, nonce_prefix)


def _nonce(prefix: bytes, index: int) -> bytes:
    if index < 0 or index > MAX_CHUNKS:
        raise InvalidEncryptedDocument("Chunk counter exhausted")
    return prefix + index.to_bytes(4, "big")


def encrypt_stream(
    source: BinaryIO,
    destination: BinaryIO,
    key: bytes,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> None:
    """Encrypt a stream into the v1 container without loading it all into RAM."""
    _validate_key(key)
    if not MIN_CHUNK_SIZE <= chunk_size <= MAX_CHUNK_SIZE:
        raise ValueError(
            f"chunk_size must be between {MIN_CHUNK_SIZE} and {MAX_CHUNK_SIZE}"
        )

    prefix = os.urandom(NONCE_PREFIX_SIZE)
    header = _make_header(chunk_size, prefix)
    destination.write(header)
    aes = AESGCM(key)
    index = 0

    while True:
        plaintext = source.read(chunk_size)
        if not plaintext:
            break
        if index >= MAX_CHUNKS:
            raise InvalidEncryptedDocument("Document exceeds chunk counter capacity")

        aad = header + index.to_bytes(4, "big") + len(plaintext).to_bytes(4, "big")
        encrypted = aes.encrypt(_nonce(prefix, index), plaintext, aad)
        destination.write(LENGTH_STRUCT.pack(len(plaintext)))
        destination.write(encrypted)
        index += 1

    destination.write(LENGTH_STRUCT.pack(0))


def encrypt_file(
    source_path: str | Path,
    destination_path: str | Path,
    key: bytes,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> None:
    """Encrypt a source file. Destination contains ciphertext only."""
    with open(source_path, "rb") as source, open(destination_path, "wb") as destination:
        encrypt_stream(source, destination, key, chunk_size=chunk_size)


def decrypt_file(
    source_path: str | Path,
    destination_path: str | Path,
    key: bytes,
) -> None:
    """Decrypt an authenticated container to a destination plaintext file."""
    with open(source_path, "rb") as source, open(destination_path, "wb") as destination:
        for chunk in decrypt_stream(source, key):
            destination.write(chunk)


def decrypt_stream(
    source: BinaryIO,
    key: bytes,
) -> Iterator[bytes]:
    """
    Yield authenticated plaintext chunks.

    Each chunk is authenticated before it is yielded. Consumers should still
    discard all prior chunks if a later chunk fails or the terminator is absent.
    """
    _validate_key(key)
    header = source.read(HEADER_STRUCT.size)
    if len(header) != HEADER_STRUCT.size:
        raise InvalidEncryptedDocument("Truncated container header")

    magic, version, chunk_size, prefix = HEADER_STRUCT.unpack(header)
    if magic != MAGIC or version != VERSION:
        raise InvalidEncryptedDocument("Unsupported container or version")
    if not MIN_CHUNK_SIZE <= chunk_size <= MAX_CHUNK_SIZE:
        raise InvalidEncryptedDocument("Invalid chunk size")

    aes = AESGCM(key)
    index = 0

    while True:
        length_bytes = source.read(LENGTH_STRUCT.size)
        if len(length_bytes) != LENGTH_STRUCT.size:
            raise InvalidEncryptedDocument("Missing chunk length or terminator")

        plaintext_length = LENGTH_STRUCT.unpack(length_bytes)[0]
        if plaintext_length == 0:
            # Reject trailing bytes; the container must have one exact ending.
            if source.read(1):
                raise InvalidEncryptedDocument("Trailing data after terminator")
            return

        if plaintext_length > chunk_size:
            raise InvalidEncryptedDocument("Chunk exceeds declared chunk size")
        if index >= MAX_CHUNKS:
            raise InvalidEncryptedDocument("Chunk counter exhausted")

        encrypted_length = plaintext_length + TAG_SIZE
        encrypted = source.read(encrypted_length)
        if len(encrypted) != encrypted_length:
            raise InvalidEncryptedDocument("Truncated encrypted chunk")

        aad = (
            header
            + index.to_bytes(4, "big")
            + plaintext_length.to_bytes(4, "big")
        )
        try:
            plaintext = aes.decrypt(_nonce(prefix, index), encrypted, aad)
        except InvalidTag as exc:
            raise AuthenticationFailed(
                f"Authentication failed for chunk {index}"
            ) from exc

        yield plaintext
        index += 1


def decrypt_to_buffer(source: BinaryIO, key: bytes):
    """
    Authenticate and collect plaintext in a RAM-only BytesIO buffer.

    The caller must close the returned buffer. This function never uses a
    disk-backed spooled temporary file.
    """
    from io import BytesIO

    buffer = BytesIO()
    try:
        for chunk in decrypt_stream(source, key):
            buffer.write(chunk)
        buffer.seek(0)
        return buffer
    except Exception:
        buffer.close()
        raise
