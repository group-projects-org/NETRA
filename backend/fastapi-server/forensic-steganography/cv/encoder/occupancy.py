"""Step 5a - page occupancy map.

Extracts the bounding boxes of everything a dot must not overlap (text words,
raster images, vector drawings, annotations) and pads each by
``text_pad_pt``. All boxes are returned in unrotated page space, which is the
same space PyMuPDF's ``Shape`` draws in.
"""

from __future__ import annotations

import numpy as np
import pymupdf

from ..core.config import DEFAULT_CONFIG, StegConfig


def page_extent(page: pymupdf.Page) -> tuple[float, float]:
    """Width and height of the unrotated drawing space."""
    box = page.cropbox
    return box.width, box.height


def extract_obstacles(page: pymupdf.Page, config: StegConfig = DEFAULT_CONFIG) -> np.ndarray:
    """Return an (M, 4) float array of padded ``[x0, y0, x1, y1]`` boxes."""
    width, height = page_extent(page)
    max_drawing_area = config.ignore_drawing_area_frac * width * height

    boxes: list[tuple[float, float, float, float]] = []
    boxes.extend(tuple(w[:4]) for w in page.get_text("words"))
    boxes.extend(tuple(info["bbox"]) for info in page.get_image_info())
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if abs(rect) <= max_drawing_area:  # skip page backgrounds / borders
            boxes.append(tuple(rect))
    boxes.extend(tuple(annot.rect) for annot in page.annots())

    if not boxes:
        return np.empty((0, 4), dtype=float)

    arr = np.asarray(boxes, dtype=float)
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
