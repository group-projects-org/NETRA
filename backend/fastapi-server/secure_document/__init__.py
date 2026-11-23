"""Secure, authenticated in-memory document processing."""

from .service import SecureDocumentService, InMemoryPdfDocument
from .crypto import encrypt_file, decrypt_file, encrypt_stream, decrypt_stream, decrypt_to_buffer
from .errors import (
    SecureDocumentError,
    InvalidEncryptedDocument,
    AuthenticationFailed,
    UnsupportedDocument,
)

__all__ = [
    "SecureDocumentService",
    "InMemoryPdfDocument",
    "encrypt_file",
    "decrypt_file",
    "encrypt_stream",
    "decrypt_stream",
    "decrypt_to_buffer",
    "SecureDocumentError",
    "InvalidEncryptedDocument",
    "AuthenticationFailed",
    "UnsupportedDocument",
]
