from io import BytesIO
import pytest
import pymupdf


@pytest.fixture
def pdf_bytes():
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "NETRA secure exam test")
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def key():
    return b"K" * 32
