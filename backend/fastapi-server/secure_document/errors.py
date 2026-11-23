"""Domain exceptions for secure document processing."""


class SecureDocumentError(Exception):
    """Base exception for this package."""


class InvalidEncryptedDocument(SecureDocumentError):
    """The encrypted container is malformed or incomplete."""


class AuthenticationFailed(SecureDocumentError):
    """A chunk failed AES-GCM authentication."""


class UnsupportedDocument(SecureDocumentError):
    """The authenticated plaintext is not a supported document."""
