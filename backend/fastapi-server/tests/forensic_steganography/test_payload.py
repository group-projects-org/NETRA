import hashlib
import hmac

import pytest

from forensic_steganography.core.errors import PayloadError
from forensic_steganography.encoder.payload import build_packet, compute_tag, serialize_payload

from .conftest import SPEC_PAYLOAD, TEST_SECRET


def test_spec_vector_bytes():
    assert list(serialize_payload(SPEC_PAYLOAD)) == [
        67, 73, 68, 49, 48, 48, 55, 95, 50, 51, 58, 52, 56, 58, 53, 54,
    ]


def test_short_payload_is_nul_padded():
    assert serialize_payload("CID1") == b"CID1" + b"\x00" * 12


def test_tag_is_hmac_sha256_mod_2_32():
    key = TEST_SECRET.encode()
    payload = serialize_payload(SPEC_PAYLOAD)
    digest = hmac.new(key, payload, hashlib.sha256).digest()
    expected = int.from_bytes(digest, "big") % 2**32
    tag = compute_tag(key, payload)
    assert len(tag) == 4
    assert int.from_bytes(tag, "big") == expected
    assert tag == digest[-4:]


def test_packet_layout():
    key = TEST_SECRET.encode()
    packet = build_packet(SPEC_PAYLOAD, key)
    assert len(packet) == 20
    assert packet[:16] == SPEC_PAYLOAD.encode()
    assert packet[16:] == compute_tag(key, packet[:16])


def test_tag_depends_on_key():
    payload = serialize_payload(SPEC_PAYLOAD)
    assert compute_tag(b"k" * 16, payload) != compute_tag(b"j" * 16, payload)


@pytest.mark.parametrize("bad", ["", "X" * 17, "CIDé1007", "CID\n1007", "CID\x001007", 1007])
def test_rejects_invalid_payload(bad):
    with pytest.raises(PayloadError):
        serialize_payload(bad)
