import os
from io import BytesIO
from pathlib import Path

import pytest
import pymupdf

from secure_document.__main__ import main, parse_key, resolve_key


@pytest.fixture
def sample_pdf_file(tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "NETRA CLI test examination document")
    doc.save(str(pdf_path))
    doc.close()
    return pdf_path


def test_parse_key():
    raw_32 = b"0123456789abcdef0123456789abcdef"
    assert parse_key(raw_32.decode("ascii")) == raw_32

    hex_64 = "0123456789abcdef" * 4
    assert parse_key(hex_64) == bytes.fromhex(hex_64)

    with pytest.raises(ValueError, match="Key must be exactly 32 bytes"):
        parse_key("too_short")


def test_resolve_key_from_arg():
    raw_32 = "0123456789abcdef0123456789abcdef"
    assert resolve_key(raw_32) == raw_32.encode("utf-8")


def test_resolve_key_from_env(monkeypatch):
    hex_64 = "0123456789abcdef" * 4
    monkeypatch.setenv("NETRA_DOCUMENT_KEY", hex_64)
    assert resolve_key(None) == bytes.fromhex(hex_64)


def test_resolve_key_missing_raises(monkeypatch):
    monkeypatch.delenv("NETRA_DOCUMENT_KEY", raising=False)
    monkeypatch.delenv("NETRA_DOC_KEY", raising=False)
    monkeypatch.setattr("secure_document.__main__.find_dotenv", lambda **kwargs: "")
    with pytest.raises(ValueError, match="No encryption key provided"):
        resolve_key(None)


def test_cli_keygen(capsys):
    ret = main(["keygen"])
    assert ret == 0
    captured = capsys.readouterr().out
    assert "Generated 32-byte AES-256 Key" in captured


def test_cli_encrypt_and_inspect_and_render(sample_pdf_file, tmp_path, capsys):
    key_hex = ("ab" * 32)
    output_ntr = tmp_path / "encrypted.ntr"

    # Encrypt
    ret = main(["encrypt", str(sample_pdf_file), str(output_ntr), "--key", key_hex])
    assert ret == 0
    assert output_ntr.exists()
    assert output_ntr.stat().st_size > 0
    out = capsys.readouterr().out
    assert "Encrypted" in out

    # Inspect
    ret = main(["inspect", str(output_ntr), "--key", key_hex])
    assert ret == 0
    out = capsys.readouterr().out
    assert "Pages: 1" in out
    assert "Authentication: verified" in out

    # Render
    ret = main(["render", str(output_ntr), "--key", key_hex, "--page", "0", "--dpi", "72"])
    assert ret == 0
    out = capsys.readouterr().out
    assert "Rendered page 1/1 in RAM" in out
    assert "Verified in memory" in out

    # Render with --output image
    preview_img = tmp_path / "page_0.png"
    ret = main(["render", str(output_ntr), "--output", str(preview_img), "--key", key_hex])
    assert ret == 0
    assert preview_img.exists()
    assert preview_img.stat().st_size > 0
    out = capsys.readouterr().out
    assert "Saved rendered page image" in out

    # Decrypt
    decrypted_pdf = tmp_path / "recovered.pdf"
    ret = main(["decrypt", str(output_ntr), str(decrypted_pdf), "--key", key_hex])
    assert ret == 0
    assert decrypted_pdf.exists()
    assert decrypted_pdf.stat().st_size == sample_pdf_file.stat().st_size
    assert decrypted_pdf.read_bytes() == sample_pdf_file.read_bytes()
    out = capsys.readouterr().out
    assert "Decrypted" in out


def test_cli_shorthand_encrypt(sample_pdf_file, tmp_path):
    key_hex = ("cd" * 32)
    output_ntr = tmp_path / "shorthand.ntr"

    # Running without 'encrypt' keyword defaults to encrypt
    ret = main([str(sample_pdf_file), str(output_ntr), "--key", key_hex])
    assert ret == 0
    assert output_ntr.exists()


def test_cli_errors(tmp_path, capsys):
    # Non-existent input
    ret = main(["encrypt", str(tmp_path / "missing.pdf"), str(tmp_path / "out.ntr"), "--key", "00" * 32])
    assert ret == 1
    err = capsys.readouterr().err
    assert "not found" in err

    # Inspect non-existent file
    ret = main(["inspect", str(tmp_path / "missing.ntr"), "--key", "00" * 32])
    assert ret == 1

    # Render non-existent file
    ret = main(["render", str(tmp_path / "missing.ntr"), "--key", "00" * 32])
    assert ret == 1
