from io import BytesIO

import pytest

from secure_document.crypto import encrypt_stream, decrypt_stream, decrypt_to_buffer
from secure_document.errors import AuthenticationFailed, InvalidEncryptedDocument


def test_encrypt_decrypt_roundtrip(key):
    original = b"test examination document" * 500
    encrypted = BytesIO()
    encrypt_stream(BytesIO(original), encrypted, key, chunk_size=1024)

    encrypted.seek(0)
    recovered = b"".join(decrypt_stream(encrypted, key))
    assert recovered == original


def test_empty_document_roundtrip(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b""), encrypted, key, chunk_size=1024)
    encrypted.seek(0)
    assert b"".join(decrypt_stream(encrypted, key)) == b""


def test_wrong_key_fails_authentication(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b"secret"), encrypted, key, chunk_size=1024)
    encrypted.seek(0)
    with pytest.raises(AuthenticationFailed):
        list(decrypt_stream(encrypted, b"Z" * 32))


def test_tampered_ciphertext_fails(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b"A" * 1500), encrypted, key, chunk_size=1024)
    raw = bytearray(encrypted.getvalue())
    # Header (17 bytes) + length (4 bytes), then ciphertext.
    raw[25] ^= 0x01
    with pytest.raises(AuthenticationFailed):
        list(decrypt_stream(BytesIO(raw), key))


def test_missing_terminator_fails(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b"payload"), encrypted, key, chunk_size=1024)
    raw = encrypted.getvalue()[:-4]
    with pytest.raises(InvalidEncryptedDocument):
        list(decrypt_stream(BytesIO(raw), key))


def test_decrypt_to_buffer_is_memory_buffer(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b"plaintext"), encrypted, key, chunk_size=1024)
    encrypted.seek(0)
    result = decrypt_to_buffer(encrypted, key)
    try:
        assert result.read() == b"plaintext"
    finally:
        result.close()


def test_encrypt_decrypt_file_roundtrip(tmp_path, key):
    source = tmp_path / "source.bin"
    encrypted = tmp_path / "enc.ntr"
    decrypted = tmp_path / "dec.bin"

    data = b"Roundtrip test content" * 100
    source.write_bytes(data)

    from secure_document.crypto import encrypt_file, decrypt_file
    encrypt_file(source, encrypted, key)
    decrypt_file(encrypted, decrypted, key)

    assert decrypted.read_bytes() == data
