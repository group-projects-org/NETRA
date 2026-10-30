"""Encoder command-line interface (Phase 1).

Works from any folder once the backend venv is active (the package is
installed in editable mode by backend/requirements.txt):

    netra-encode in.pdf out.pdf --payload CID1007_23:48:56 [--debug] [--report r.json] [--ink 1.0]
    python -m forensic_steganography.encoder in.pdf out.pdf --payload CID1007_23:48:56

The HMAC key comes from --secret, else $NETRA_STEG_SECRET, else backend/.env.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import dataclasses

from ..core.config import DEFAULT_CONFIG, SECRET_ENV_VAR
from ..core.errors import StegError
from .pipeline import encode_pdf


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="netra-encode",
        description="Embed a forensic micro-dot watermark into a PDF.",
    )
    parser.add_argument("input", type=Path, help="source PDF")
    parser.add_argument("output", type=Path, help="destination PDF")
    parser.add_argument("--payload", required=True, help="ASCII ID, max 16 chars")
    parser.add_argument("--secret", help=f"HMAC key (default: ${SECRET_ENV_VAR})")
    parser.add_argument("--debug", action="store_true",
                        help="render enlarged magenta dots for visual inspection")
    parser.add_argument("--report", type=Path, help="write the encode report as JSON")
    parser.add_argument("--ink", type=float, default=1.0, metavar="0-1",
                        help="yellow ink strength (default 1.0). Lower is less visible, but "
                             "below 1.0 phone-photo detection fails in simulation; scans still work")
    args = parser.parse_args(argv)

    if not 0.05 <= args.ink <= 1.0:
        parser.error("--ink must be between 0.05 and 1.0")
    config = dataclasses.replace(DEFAULT_CONFIG, color_cmyk=(0.0, 0.0, args.ink, 0.0))

    try:
        pdf, report = encode_pdf(args.input, args.payload, secret=args.secret,
                                 config=config, debug=args.debug)
    except (StegError, FileNotFoundError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    args.output.write_bytes(pdf)
    if args.report:
        args.report.write_text(json.dumps(report.to_dict(), indent=2))

    print(f"wrote {args.output}  ({len(pdf) / 1024:.1f} KiB)")
    print(f"codeword  {report.codeword_hex}")
    for p in report.pages:
        print(f"page {p.page + 1:>3}: {p.tiles:>4} tiles  {p.dots_drawn:>6} dots  "
              f"{p.cells_suppressed:>6} suppressed  "
              f"{p.self_decodable_tiles:>4} self-decodable"
              f"{'  (scanned page)' if p.scanned else ''}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
