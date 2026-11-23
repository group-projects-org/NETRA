"""In-memory PDF loading and rendering."""

from __future__ import annotations

from io import BytesIO
from typing import BinaryIO

import pymupdf

from .crypto import decrypt_to_buffer
from .errors import UnsupportedDocument


class InMemoryPdfDocument:
    """A PDF opened from authenticated plaintext held in RAM."""

    def __init__(self, plaintext_buffer: BytesIO):
        self._buffer = plaintext_buffer
        self._document = None
        self._closed = False

        try:
            self._document = pymupdf.open(
                stream=self._buffer.getvalue(),
                filetype="pdf",
            )
            if not self._document.is_pdf:
                raise UnsupportedDocument("Plaintext is not a PDF")
        except Exception as exc:
            self.close()
            if isinstance(exc, UnsupportedDocument):
                raise
            raise UnsupportedDocument("Unable to open authenticated PDF") from exc

    @property
    def page_count(self) -> int:
        self._ensure_open()
        return self._document.page_count

    def render_page(self, page_number: int, *, dpi: int = 120):
        """Render a page to an in-memory PyMuPDF Pixmap."""
        self._ensure_open()
        if not 1 <= dpi <= 600:
            raise ValueError("dpi must be between 1 and 600")
        if not 0 <= page_number < self._document.page_count:
            raise IndexError("Page number out of range")

        page = self._document.load_page(page_number)
        return page.get_pixmap(dpi=dpi, alpha=False)

    def _ensure_open(self) -> None:
        if self._closed:
            raise RuntimeError("Document is closed")

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        if self._document is not None:
            self._document.close()
            self._document = None
        self._buffer.close()

    def __enter__(self):
        self._ensure_open()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()


class SecureDocumentService:
    """Application service for opening encrypted PDF documents."""

    def open_encrypted(self, source: str | BinaryIO, key: bytes) -> InMemoryPdfDocument:
        """
        Decrypt and authenticate the encrypted container into RAM, then open PDF.

        `source` may be a path or a binary stream. Plaintext is never written
        to a filesystem path by this service.
        """
        if isinstance(source, (str, bytes)) or hasattr(source, "__fspath__"):
            with open(source, "rb") as encrypted_file:
                buffer = decrypt_to_buffer(encrypted_file, key)
        else:
            buffer = decrypt_to_buffer(source, key)

        return InMemoryPdfDocument(buffer)
