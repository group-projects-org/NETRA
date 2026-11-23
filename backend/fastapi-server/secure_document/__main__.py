"""Command-line interface for NETRA Secure Document Processing.

Allows single-command encryption, decryption, in-memory inspection, and rendering:

    netra-secure-doc encrypt input.pdf output.ntr [--key KEY]
    netra-secure-doc decrypt input.ntr output.pdf [--key KEY] [--open]
    netra-secure-doc inspect input.ntr [--key KEY]
    netra-secure-doc render input.ntr [--output page.png] [--page 0] [--dpi 120] [--key KEY] [--open]
    netra-secure-doc keygen
    python -m secure_document encrypt input.pdf output.ntr [--key KEY]

The 32-byte AES key can be supplied via --key (as 64 hex characters or 32-byte text),
or from the NETRA_DOCUMENT_KEY environment variable / backend/.env.
"""

from __future__ import annotations

import argparse
import os
import secrets
import sys
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

from .crypto import encrypt_file, decrypt_file
from .errors import SecureDocumentError
from .service import SecureDocumentService

KEY_ENV_VAR = "NETRA_DOCUMENT_KEY"


def parse_key(key_str: str) -> bytes:
    """Parse a string key provided as hex or 32 raw ASCII characters."""
    stripped = key_str.strip()
    if len(stripped) == 64:
        try:
            return bytes.fromhex(stripped)
        except ValueError:
            pass
    raw = stripped.encode("utf-8")
    if len(raw) == 32:
        return raw
    raise ValueError(
        f"Key must be exactly 32 bytes (or 64 hex characters); got {len(stripped)} chars / {len(raw)} bytes."
    )


def resolve_key(key_arg: str | None) -> bytes:
    """Resolve key from argument, environment, or .env file."""
    if key_arg:
        return parse_key(key_arg)

    env_val = os.environ.get(KEY_ENV_VAR) or os.environ.get("NETRA_DOC_KEY")
    if not env_val:
        # Try loading .env from current directory or parent directories
        dotenv_path = find_dotenv(usecwd=True)
        if dotenv_path:
            load_dotenv(dotenv_path)
            env_val = os.environ.get(KEY_ENV_VAR) or os.environ.get("NETRA_DOC_KEY")

    if not env_val:
        raise ValueError(
            f"No encryption key provided. Pass --key, set ${KEY_ENV_VAR}, "
            f"or define it in .env. Run 'netra-secure-doc keygen' to create one."
        )

    return parse_key(env_val)


def cmd_encrypt(args: argparse.Namespace) -> int:
    key = resolve_key(args.key)
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"error: input file '{input_path}' not found", file=sys.stderr)
        return 1

    encrypt_file(input_path, output_path, key)
    output_size_kb = output_path.stat().st_size / 1024
    print(f"Encrypted '{input_path}' -> '{output_path}' ({output_size_kb:.1f} KiB)")
    return 0


def cmd_decrypt(args: argparse.Namespace) -> int:
    key = resolve_key(args.key)
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"error: input file '{input_path}' not found", file=sys.stderr)
        return 1

    decrypt_file(input_path, output_path, key)
    output_size_kb = output_path.stat().st_size / 1024
    print(f"Decrypted '{input_path}' -> '{output_path}' ({output_size_kb:.1f} KiB)")
    if getattr(args, "open", False):
        try:
            os.startfile(str(output_path))
        except Exception:
            pass
    return 0


def cmd_inspect(args: argparse.Namespace) -> int:
    key = resolve_key(args.key)
    input_path = Path(args.input)

    if not input_path.exists():
        print(f"error: input file '{input_path}' not found", file=sys.stderr)
        return 1

    service = SecureDocumentService()
    with service.open_encrypted(input_path, key) as doc:
        print(f"Container: '{input_path}'")
        print(f"Authentication: verified (in-memory)")
        print(f"Pages: {doc.page_count}")
    return 0


def cmd_render(args: argparse.Namespace) -> int:
    key = resolve_key(args.key)
    input_path = Path(args.input)

    if not input_path.exists():
        print(f"error: input file '{input_path}' not found", file=sys.stderr)
        return 1

    service = SecureDocumentService()
    with service.open_encrypted(input_path, key) as doc:
        pixmap = doc.render_page(args.page, dpi=args.dpi)
        print(f"Container: '{input_path}'")
        print(f"Rendered page {args.page + 1}/{doc.page_count} in RAM")
        print(f"Dimensions: {pixmap.width}x{pixmap.height} px, DPI: {args.dpi}")

        output_file = getattr(args, "output", None)
        if output_file:
            out_p = Path(output_file)
            pixmap.save(str(out_p))
            print(f"Saved rendered page image: '{out_p}'")
            if getattr(args, "open", False):
                try:
                    os.startfile(str(out_p))
                except Exception:
                    pass
        else:
            print("Status: Verified in memory (pass --output <page.png> to save preview image)")
    return 0


def cmd_keygen(_args: argparse.Namespace) -> int:
    key_bytes = secrets.token_bytes(32)
    key_hex = key_bytes.hex()
    print("Generated 32-byte AES-256 Key (Hex format):")
    print(key_hex)
    print(f"\nUsage:\n  export {KEY_ENV_VAR}={key_hex}\n  or pass --key {key_hex}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="netra-secure-doc",
        description="Authenticate and process encrypted NETRA examination documents.",
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Sub-commands")

    # Encrypt sub-command
    p_encrypt = subparsers.add_parser("encrypt", help="Encrypt a PDF document into an authenticated .ntr file")
    p_encrypt.add_argument("input", type=Path, help="Source PDF file path")
    p_encrypt.add_argument("output", type=Path, help="Destination .ntr file path")
    p_encrypt.add_argument("--key", help=f"32-byte key or 64-char hex string (default: ${KEY_ENV_VAR})")
    p_encrypt.set_defaults(func=cmd_encrypt)

    # Decrypt sub-command
    p_decrypt = subparsers.add_parser("decrypt", help="Decrypt an authenticated .ntr file back to a PDF")
    p_decrypt.add_argument("input", type=Path, help="Source .ntr file path")
    p_decrypt.add_argument("output", type=Path, help="Destination PDF file path")
    p_decrypt.add_argument("--key", help=f"32-byte key or 64-char hex string (default: ${KEY_ENV_VAR})")
    p_decrypt.add_argument("--open", action="store_true", help="Open the decrypted PDF after decryption")
    p_decrypt.set_defaults(func=cmd_decrypt)

    # Inspect sub-command
    p_inspect = subparsers.add_parser("inspect", help="Inspect and verify an encrypted document in RAM")
    p_inspect.add_argument("input", type=Path, help="Encrypted .ntr file path")
    p_inspect.add_argument("--key", help=f"32-byte key or 64-char hex string (default: ${KEY_ENV_VAR})")
    p_inspect.set_defaults(func=cmd_inspect)

    # Render sub-command
    p_render = subparsers.add_parser("render", help="Render a page of an encrypted document in memory")
    p_render.add_argument("input", type=Path, help="Encrypted .ntr file path")
    p_render.add_argument("--output", "-o", type=Path, help="Optional image output path (e.g. page.png) to view the rendered page")
    p_render.add_argument("--page", type=int, default=0, help="Page index (0-indexed, default: 0)")
    p_render.add_argument("--dpi", type=int, default=120, help="Rendering DPI (1-600, default: 120)")
    p_render.add_argument("--key", help=f"32-byte key or 64-char hex string (default: ${KEY_ENV_VAR})")
    p_render.add_argument("--open", action="store_true", help="Open the rendered image in system image viewer")
    p_render.set_defaults(func=cmd_render)

    # Keygen sub-command
    p_keygen = subparsers.add_parser("keygen", help="Generate a random 32-byte AES key in hex")
    p_keygen.set_defaults(func=cmd_keygen)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()

    # Convenience: if first arg is not a known subcommand and two positional args exist, default to encrypt
    raw_args = list(argv if argv is not None else sys.argv[1:])
    known_commands = {"encrypt", "decrypt", "inspect", "render", "keygen", "-h", "--help"}

    if raw_args and raw_args[0] not in known_commands and not raw_args[0].startswith("-"):
        # e.g.: netra-secure-doc input.pdf output.ntr ...
        raw_args.insert(0, "encrypt")

    args = parser.parse_args(raw_args)

    if not hasattr(args, "func"):
        parser.print_help()
        return 1

    try:
        return args.func(args)
    except (SecureDocumentError, ValueError, IndexError, RuntimeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
