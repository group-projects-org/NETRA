"""Command-line interface.

    python -m cv.encoder in.pdf out.pdf --payload CID1007_23:48:56 [--debug] [--report r.json]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from ..core.config import SECRET_ENV_VAR
from ..core.errors import StegError


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m cv.encoder",
        description="Embed a forensic micro-dot watermark into a PDF.",
    )
    parser.add_argument("input", type=Path, help="source PDF")
    parser.add_argument("output", type=Path, help="destination PDF")
    parser.add_argument("--payload", required=True, help="ASCII ID, max 16 chars")
    parser.add_argument("--secret", help=f"HMAC key (default: ${SECRET_ENV_VAR})")
    parser.add_argument("--debug", action="store_true",
                        help="render enlarged magenta dots for visual inspection")
    parser.add_argument("--report", type=Path, help="write the encode report as JSON")
    args = parser.parse_args(argv)

    try:
        pdf, report = encode_pdf(args.input, args.payload, secret=args.secret, debug=args.debug)
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
              f"{p.self_decodable_tiles:>4} self-decodable")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
