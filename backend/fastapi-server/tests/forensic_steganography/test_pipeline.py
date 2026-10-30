import cv2
import numpy as np
import pymupdf
import pytest

from forensic_steganography.core.config import ConfigError, DEFAULT_CONFIG
from forensic_steganography.core.errors import StegError
from forensic_steganography.encoder import encode_pdf
from forensic_steganography.encoder.__main__ import main as cli_main
from forensic_steganography.encoder.placement import collides, plan_page, tile_origins

from .conftest import SPEC_PAYLOAD, make_pdf

R = DEFAULT_CONFIG.dot_r


def _word_boxes(page: pymupdf.Page) -> np.ndarray:
    return np.array([w[:4] for w in page.get_text("words")], dtype=float)


def test_output_is_valid_pdf_and_text_survives(sample_pdf):
    out, report = encode_pdf(sample_pdf, SPEC_PAYLOAD)
    src, dst = pymupdf.open(stream=sample_pdf), pymupdf.open(stream=out)
    assert dst.page_count == src.page_count == 1
    assert dst[0].get_text("words") == src[0].get_text("words")
    assert report.codeword_hex.startswith(SPEC_PAYLOAD.encode().hex())
    assert report.dots_drawn > 0


def test_no_dot_overlaps_text(sample_pdf):
    out, report = encode_pdf(sample_pdf, SPEC_PAYLOAD)
    page = pymupdf.open(stream=out)[0]
    dots = report.pages[0].dots
    assert len(dots) > 0
    # Even against unpadded word boxes, no dot disc may intersect a word.
    assert not collides(dots, _word_boxes(page), R).any()
    # And no dot is within the configured padding either.
    pad = DEFAULT_CONFIG.text_pad_pt
    assert not collides(dots, _word_boxes(page), R + pad - 1e-6).any()


def test_rotated_page_still_avoids_text():
    pdf = make_pdf(rotation=90)
    out, report = encode_pdf(pdf, SPEC_PAYLOAD)
    page = pymupdf.open(stream=out)[0]
    assert not collides(report.pages[0].dots, _word_boxes(page), R).any()


def test_rendered_dot_count_matches_report():
    # Small blank page, production ink; count yellow blobs in a 400 dpi raster.
    pdf = make_pdf(width=200, height=200, text=False)
    out, report = encode_pdf(pdf, SPEC_PAYLOAD)
    page = pymupdf.open(stream=out)[0]
    pix = page.get_pixmap(dpi=400)
    img = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, pix.n)
    yellow = (img[..., 0] > 200) & (img[..., 1] > 200) & (img[..., 2] < 128)
    n_blobs = cv2.connectedComponents(yellow.astype(np.uint8))[0] - 1
    p = report.pages[0]
    assert n_blobs == p.dots_drawn + p.pilots_drawn


def test_dots_use_cmyk_yellow_under_content(sample_pdf):
    out, _ = encode_pdf(sample_pdf, SPEC_PAYLOAD)
    stream = pymupdf.open(stream=out)[0].read_contents()
    assert b"0 0 1 0 K" in stream
    assert b"1 J" in stream  # round caps -> circular dots
    assert stream.index(b"0 0 1 0 K") < stream.index(b"BT")  # drawn before text


def test_debug_mode_uses_magenta(sample_pdf):
    out, report = encode_pdf(sample_pdf, SPEC_PAYLOAD, debug=True)
    assert report.debug
    assert b"1 0 1 RG" in pymupdf.open(stream=out)[0].read_contents()


def test_blank_page_tiles_are_all_intact():
    pdf = make_pdf(text=False)
    _, report = encode_pdf(pdf, SPEC_PAYLOAD)
    p = report.pages[0]
    assert p.tiles > 0
    assert p.cells_suppressed == 0
    assert p.intact_tiles == p.self_decodable_tiles == p.tiles


def test_tiles_stay_inside_margins():
    cfg = DEFAULT_CONFIG
    origins = tile_origins(595, 842)
    assert len(origins) > 0
    assert origins.min() >= cfg.page_margin_pt
    assert (origins[:, 0] + cfg.tile_size_pt).max() <= 595 - cfg.page_margin_pt
    assert (origins[:, 1] + cfg.tile_size_pt).max() <= 842 - cfg.page_margin_pt


def test_obstacle_covering_tile_suppresses_it():
    origins = tile_origins(595, 842)
    x, y = origins[0]
    size = DEFAULT_CONFIG.tile_size_pt
    box = np.array([[x - 1, y - 1, x + size + 1, y + size + 1]])
    plan = plan_page(595, 842, np.ones((16, 16), np.uint8), box)
    assert not plan.self_decodable[0]
    assert not plan.pilot_visible[0].any()
    assert plan.self_decodable[1:].all()


def test_multi_page_and_page_selection():
    pdf = make_pdf(pages=3)
    _, report = encode_pdf(pdf, SPEC_PAYLOAD, pages=[0, 2])
    assert [p.page for p in report.pages] == [0, 2]
    assert set(report.to_dict()["pages"][0]) >= {"tiles", "dots_drawn"}
    assert "dots" not in report.to_dict()["pages"][0]


def test_missing_secret_raises(sample_pdf, monkeypatch):
    monkeypatch.delenv("NETRA_STEG_SECRET")
    with pytest.raises(ConfigError):
        encode_pdf(sample_pdf, SPEC_PAYLOAD)


def test_explicit_secret_overrides_env(sample_pdf):
    _, a = encode_pdf(sample_pdf, SPEC_PAYLOAD)
    _, b = encode_pdf(sample_pdf, SPEC_PAYLOAD, secret="another-secret-key-123")
    assert a.codeword_hex != b.codeword_hex


def test_rejects_non_pdf():
    with pytest.raises((StegError, RuntimeError)):
        encode_pdf(b"not a pdf", SPEC_PAYLOAD)


def test_cli(tmp_path, sample_pdf):
    src, dst, rep = tmp_path / "in.pdf", tmp_path / "out.pdf", tmp_path / "r.json"
    src.write_bytes(sample_pdf)
    assert cli_main([str(src), str(dst), "--payload", SPEC_PAYLOAD, "--report", str(rep)]) == 0
    assert pymupdf.open(dst).page_count == 1
    assert '"self_decodable_tiles"' in rep.read_text()
    assert cli_main([str(src), str(dst), "--payload", "X" * 17]) == 1


def _scanned_pdf() -> bytes:
    """A page that is one full-page raster image (no text layer), like a scan."""
    text_page = pymupdf.open(stream=make_pdf())[0]
    png = text_page.get_pixmap(dpi=150).tobytes("png")
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_image(page.rect, stream=png)
    return doc.tobytes()


def test_scanned_page_gets_dots_on_top_avoiding_ink():
    pdf = _scanned_pdf()
    out, report = encode_pdf(pdf, SPEC_PAYLOAD)
    p = report.pages[0]
    assert p.scanned
    assert p.dots_drawn > 1000  # the page-sized image no longer blocks everything
    page = pymupdf.open(stream=out)[0]
    stream = page.read_contents()
    assert stream.index(b"0 0 1 0 K") > stream.index(b"Do")  # drawn after (on top of) the scan

    # Pixel-level check against the scan itself: no dark pixel within reach of a dot.
    dpi = 150
    pix = pymupdf.open(stream=pdf)[0].get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    gray = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w)
    ink = (gray < 0.7 * np.percentile(gray, 90)).astype(np.uint8)
    reach = int(np.ceil((R + 1.0) * dpi / 72))  # dot radius + 1 pt margin
    near_ink = cv2.dilate(ink, np.ones((2 * reach + 1, 2 * reach + 1), np.uint8))
    px = np.clip(np.rint(p.dots * dpi / 72).astype(int), 0, [pix.w - 1, pix.h - 1])
    assert not near_ink[px[:, 1], px[:, 0]].any()


def test_small_images_still_block_dots():
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    png = pymupdf.open(stream=make_pdf(width=100, height=100, text=False))[0].get_pixmap(dpi=72).tobytes("png")
    box = pymupdf.Rect(200, 300, 300, 400)
    page.insert_image(box, stream=png)
    _, report = encode_pdf(doc.tobytes(), SPEC_PAYLOAD)
    assert not report.pages[0].scanned
    assert not collides(report.pages[0].dots, np.array([tuple(box)]), R).any()


def test_cli_ink_strength(tmp_path, sample_pdf):
    src, dst = tmp_path / "in.pdf", tmp_path / "out.pdf"
    src.write_bytes(sample_pdf)
    assert cli_main([str(src), str(dst), "--payload", SPEC_PAYLOAD, "--ink", "0.4"]) == 0
    assert b"0 0 .4 0 K" in pymupdf.open(dst)[0].read_contents()
    with pytest.raises(SystemExit):
        cli_main([str(src), str(dst), "--payload", SPEC_PAYLOAD, "--ink", "2"])
