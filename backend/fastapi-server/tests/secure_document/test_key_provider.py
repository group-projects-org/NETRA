import pytest
from secure_document.keys import StaticKeyProvider


def test_static_provider_returns_key():
    key = b"A" * 32
    provider = StaticKeyProvider(key)
    assert provider.get_document_key("paper-001") == key


def test_static_provider_rejects_invalid_key():
    with pytest.raises(ValueError):
        StaticKeyProvider(b"short")
