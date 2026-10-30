"""Step 6 - vector rendering of the dot field into the PDF content stream.

Each dot is emitted as a zero-length stroke with a round line cap
(``x y m x y l`` + ``1 J``). Per the PDF spec this paints a filled circle of
diameter equal to the line width, at ~25 bytes per dot instead of ~150 for
a four-Bezier circle, which keeps tens of thousands of dots per page cheap.
The shape is committed with ``overlay=False`` so the dots sit underneath the
existing page content - except on scanned pages, where an opaque page-sized
image would hide them; there they are drawn on top (they still avoid all ink).
"""

from __future__ import annotations

import numpy as np
import pymupdf

from ..core.config import DEFAULT_CONFIG, StegConfig


def _stroke_points(shape: pymupdf.Shape, points: np.ndarray, radius: float, color: tuple[float, ...]) -> None:
    """Vectorised equivalent of ``shape.draw_line(p, p)`` for every point.

    Calling draw_line per dot spends ~90% of encode time in per-point Point
    construction and matrix transforms; here all points are mapped to PDF
    user space with one matrix product and formatted in a single pass.
    """
    if len(points) == 0:
        return
    m = shape.ipctm  # page space -> PDF user space (handles rotation / cropbox)
    pdf_pts = points @ np.array([[m.a, m.b], [m.c, m.d]]) + np.array([m.e, m.f])
    shape.draw_cont += "".join(
        f"{x:g} {y:g} m\n{x:g} {y:g} l\n" for x, y in pdf_pts.tolist()
    )
    shape.last_point = None
    lo, hi = points.min(axis=0), points.max(axis=0)
    bbox = pymupdf.Rect(lo[0], lo[1], hi[0], hi[1])
    shape.rect = bbox if shape.rect is None else shape.rect | bbox
    shape.finish(color=color, width=2 * radius, lineCap=1, closePath=False)


def render_dots(
    page: pymupdf.Page,
    dots: np.ndarray,
    pilots: np.ndarray,
    config: StegConfig = DEFAULT_CONFIG,
    debug: bool = False,
    overlay: bool = False,
) -> None:
    if debug:
        color: tuple[float, ...] = config.debug_color_rgb
        scale = config.debug_radius_scale
    else:
        color, scale = config.color_cmyk, 1.0
    if len(dots) == 0 and len(pilots) == 0:
        return

    shape = page.new_shape()
    _stroke_points(shape, dots, config.dot_r * scale, color)
    _stroke_points(shape, pilots, config.pilot_r * scale, color)
    shape.commit(overlay=overlay)
