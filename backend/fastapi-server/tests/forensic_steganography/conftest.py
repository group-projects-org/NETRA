import pymupdf
import pytest

from forensic_steganography.core.config import SECRET_ENV_VAR

TEST_SECRET = "netra-unit-test-secret-key"
SPEC_PAYLOAD = "CID1007_23:48:56"


@pytest.fixture(autouse=True)
def _steg_secret(monkeypatch):
    monkeypatch.setenv(SECRET_ENV_VAR, TEST_SECRET)
    # Tests must never pick up a developer's real backend/.env key.
    monkeypatch.setattr("forensic_steganography.core.config.load_env", lambda: None)


def make_pdf(pages: int = 1, width: float = 595, height: float = 842,
             text: bool = True, rotation: int = 0) -> bytes:
    doc = pymupdf.open()
    for _ in range(pages):
        page = doc.new_page(width=width, height=height)
        if text:
            body = "Q1. Derive the Reed-Solomon bound for this exam paper. " * 25
            page.insert_textbox(pymupdf.Rect(72, 72, width - 72, height / 2), body, fontsize=11)
            page.draw_line((72, height / 2 + 20), (width - 72, height / 2 + 20))
        if rotation:
            page.set_rotation(rotation)
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def sample_pdf() -> bytes:
    return make_pdf()
