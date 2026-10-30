"""Step 5a - page occupancy map.

Extracts the bounding boxes of everything a dot must not overlap (text words,
raster images, vector drawings, annotations) and pads each by
``text_pad_pt``. All boxes are returned in unrotated page space, which is the
same space PyMuPDF's ``Shape`` draws in.

Scanned papers are a special case: the whole page is one raster image with no
text layer, so its bounding box would block every dot. Such page-sized
rasters are not treated as obstacles; instead the page is rendered and the
ink inside the scan is located pixel by pixel.
"""

from __future__ import annotations

import cv2
import numpy as np
import pymupdf

from ..core.config import DEFAULT_CONFIG, StegConfig


def page_extent(page: pymupdf.Page) -> tuple[float, float]:
    """Width and height of the unrotated drawing space."""
    box = page.cropbox
    return box.width, box.height


def raster_backgrounds(page: pymupdf.Page, config: StegConfig = DEFAULT_CONFIG) -> list[pymupdf.Rect]:
    """Images large enough to be a page scan or a full-page background."""
    width, height = page_extent(page)
    limit = config.ignore_drawing_area_frac * width * height
    return [pymupdf.Rect(i["bbox"]) for i in page.get_image_info()
            if abs(pymupdf.Rect(i["bbox"])) > limit]


def raster_ink_boxes(page: pymupdf.Page, config: StegConfig = DEFAULT_CONFIG) -> np.ndarray:
    """Bounding boxes (unpadded, page pt) of ink found in the rendered page."""
    scale = config.raster_dpi / 72
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), colorspace=pymupdf.csGRAY, alpha=False)
    gray = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w)

    white = float(np.percentile(gray, 90))
    ink = (gray < config.raster_ink_frac * white).astype(np.uint8)
    k = max(1, int(round(config.raster_join_pt * scale)))
    ink = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((k, k), np.uint8))  # glyphs -> words

    n, _, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    stats = stats[1:]
    stats = stats[stats[:, cv2.CC_STAT_AREA] >= 2]  # drop scanner specks
    if len(stats) == 0:
        return np.empty((0, 4))
    x, y = stats[:, cv2.CC_STAT_LEFT], stats[:, cv2.CC_STAT_TOP]
    w, h = stats[:, cv2.CC_STAT_WIDTH], stats[:, cv2.CC_STAT_HEIGHT]
    boxes = np.column_stack([x, y, x + w, y + h]).astype(float) / scale

    # The pixmap is in rotated (displayed) space; map back to unrotated space.
    if page.rotation:
        m = page.derotation_matrix
        corners = [np.column_stack([boxes[:, i], boxes[:, j]]) for i, j in ((0, 1), (2, 3))]
        mapped = [np.column_stack([c[:, 0] * m.a + c[:, 1] * m.c + m.e,
                                   c[:, 0] * m.b + c[:, 1] * m.d + m.f]) for c in corners]
        boxes = np.column_stack([mapped[0], mapped[1]])
    return boxes


def extract_obstacles(page: pymupdf.Page, config: StegConfig = DEFAULT_CONFIG) -> np.ndarray:
    """Return an (M, 4) float array of padded ``[x0, y0, x1, y1]`` boxes."""
    width, height = page_extent(page)
    max_drawing_area = config.ignore_drawing_area_frac * width * height

    boxes: list[tuple[float, float, float, float]] = []
    boxes.extend(tuple(w[:4]) for w in page.get_text("words"))
    for info in page.get_image_info():
        rect = pymupdf.Rect(info["bbox"])
        if abs(rect) <= max_drawing_area:  # page scans are handled pixel-wise below
            boxes.append(tuple(rect))
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if abs(rect) <= max_drawing_area:  # skip page backgrounds / borders
            boxes.append(tuple(rect))
    boxes.extend(tuple(annot.rect) for annot in page.annots())

    parts = [np.asarray(boxes, dtype=float).reshape(-1, 4)]
    if raster_backgrounds(page, config):
        parts.append(raster_ink_boxes(page, config))
    arr = np.vstack(parts)
    if len(arr) == 0:
        return np.empty((0, 4), dtype=float)

    arr = arr[np.all(np.isfinite(arr), axis=1)]
    # Normalise orientation (x0 <= x1, y0 <= y1) before padding.
    arr = np.column_stack([
        np.minimum(arr[:, 0], arr[:, 2]),
        np.minimum(arr[:, 1], arr[:, 3]),
        np.maximum(arr[:, 0], arr[:, 2]),
        np.maximum(arr[:, 1], arr[:, 3]),
    ])
    pad = config.text_pad_pt
    return arr + np.array([-pad, -pad, pad, pad])
