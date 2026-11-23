from io import BytesIO

import pytest

from secure_document.crypto import encrypt_stream
from secure_document.service import SecureDocumentService
from secure_document.errors import UnsupportedDocument


def make_encrypted_pdf(pdf_bytes, key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(pdf_bytes), encrypted, key, chunk_size=1024)
    encrypted.seek(0)
    return encrypted


def test_open_and_render_pdf_in_memory(pdf_bytes, key):
    encrypted = make_encrypted_pdf(pdf_bytes, key)
    service = SecureDocumentService()

    with service.open_encrypted(encrypted, key) as document:
        assert document.page_count == 1
        pixmap = document.render_page(0, dpi=72)
        assert pixmap.width > 0
        assert pixmap.height > 0

    with pytest.raises(RuntimeError):
        document.render_page(0)


def test_non_pdf_plaintext_rejected(key):
    encrypted = BytesIO()
    encrypt_stream(BytesIO(b"not a pdf"), encrypted, key, chunk_size=1024)
    encrypted.seek(0)

    with pytest.raises(UnsupportedDocument):
        SecureDocumentService().open_encrypted(encrypted, key)
