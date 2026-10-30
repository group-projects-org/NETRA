"""Exception hierarchy for the NETRA forensic steganography subsystem."""


class StegError(Exception):
    """Base class for all steganography errors."""


class ConfigError(StegError):
    """Invalid configuration or missing secret key."""


class PayloadError(StegError):
    """Payload cannot be serialised (non-ASCII, too long, ...)."""
