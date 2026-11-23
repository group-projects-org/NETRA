# NETRA Encoder — In-Depth Technical Guide

> How a short ID such as `CID1007_23:48:56` becomes thousands of invisible yellow
> micro-dots inside an exam PDF, explained from first principles, module by
> module, with real numbers produced by the code.

---

## Table of contents

1. [What the encoder does](#1-what-the-encoder-does)
2. [Background you need](#2-background-you-need)
3. [Architecture and file map](#3-architecture-and-file-map)
4. [Configuration — one source of truth](#4-configuration--one-source-of-truth)
5. [Step 1 · Payload and HMAC tag](#5-step-1--payload-and-hmac-tag-payloadpy)
6. [Step 2 · Reed-Solomon error correction](#6-step-2--reed-solomon-error-correction-fecpy)
7. [Step 3 · Interleaving](#7-step-3--interleaving-coreinterleaverpy)
8. [Step 4 · Bits and the 16×16 tile](#8-step-4--bits-and-the-1616-tile-bitspy-corelayoutpy-tilepy)
9. [Step 5 · Occupancy map](#9-step-5--occupancy-map-occupancypy)
10. [Step 6 · Placement and collision avoidance](#10-step-6--placement-and-collision-avoidance-placementpy)
11. [Step 7 · Vector rendering](#11-step-7--vector-rendering-rendererpy)
12. [The pipeline, the report and the CLI](#12-the-pipeline-the-report-and-the-cli)
13. [End-to-end worked example](#13-end-to-end-worked-example)
14. [Design decisions and why](#14-design-decisions-and-why)
15. [Limitations](#15-limitations)
16. [Glossary](#16-glossary)

---

## 1. What the encoder does

**Problem.** An exam paper leaks. A photo of it is on social media. Which exam
centre printed it, and when?

**Answer.** Before printing, every page is stamped with a hidden code that names
the centre and the print time. The code is:

- **invisible in practice** — tiny dots (0.28 mm) in pale yellow ink;
- **everywhere** — repeated about 200 times per A4 page, so even a cropped photo
  of one corner still contains several complete copies;
- **damage-tolerant** — error-correcting codes let the decoder recover the ID
  even when parts are hidden by text, pen marks or blur;
- **unforgeable** — a cryptographic tag means nobody without the secret key can
  produce a valid code for a different centre.

**Input → output**

```
paper.pdf  +  "CID1007_23:48:56"  +  secret key
                         │
                    netra-encode
                         ▼
paper_marked.pdf   (looks identical; carries ~17,000 yellow dots per page)
```

---

## 2. Background you need

| Concept | One-line explanation |
|---|---|
| **Bit** | A single 0 or 1. In the tile, `1` = "draw a dot", `0` = "leave empty". |
| **Byte** | 8 bits, a number 0–255. `67` = `01000011`. |
| **ASCII** | The table mapping characters to bytes: `C` = 67, `0` = 48, `:` = 58. |
| **MSB first** | Write a byte's bits from the most significant (128s place) to the least (1s place). |
| **Hash / HMAC** | A function that turns data + a secret key into a fixed "fingerprint"; impossible to reproduce without the key. |
| **Error-correcting code** | Extra bytes calculated from the data so that damaged bytes can be repaired later. |
| **PDF point (pt)** | The PDF unit of length: 1 pt = 1/72 inch = 0.3528 mm. A4 is 595 × 842 pt. |
| **CMYK** | Printer ink model: Cyan, Magenta, Yellow, blacK. `(0, 0, 1, 0)` = 100% yellow only. |
| **Content stream** | The text inside a PDF page that lists drawing commands, e.g. `10 20 m 30 40 l S` (move, line, stroke). |
| **Vectorised (NumPy)** | Doing one operation on a whole array at once instead of looping in Python — tens to hundreds of times faster. |

---

## 3. Architecture and file map

```
                ┌──────────── DATA (bytes & bits) ────────────┐   ┌──────── PAGE (geometry) ────────┐
"CID1007_..." → │ payload.py → fec.py → interleaver → tile.py │ → │ occupancy → placement → renderer │ → PDF
                │  20 bytes     28 bytes   28 bytes   16×16   │   │  boxes       dot list    ink     │
                └──────────────────────────────────────────────┘   └──────────────────────────────────┘
                     computed ONCE per document                          repeated FOR EVERY PAGE
```

The first half produces one 16×16 pattern of 0s and 1s (the **tile**). The
second half stamps that same tile across every page, skipping wherever the page
already has content.

```
forensic_steganography/
├── core/                      shared by encoder AND decoder (they must agree)
│   ├── config.py              every number of the format + secret-key loading
│   ├── layout.py              which tile cell has which job; cell & pilot positions
│   ├── interleaver.py         byte shuffling and its inverse
│   └── errors.py              StegError → ConfigError, PayloadError
└── encoder/
    ├── payload.py             Step 1  text → 16 bytes → + 4-byte HMAC tag
    ├── fec.py                 Step 2  + 8 Reed-Solomon parity bytes
    ├── bits.py                         bytes ↔ bits helpers
    ├── tile.py                Steps 3–4  interleave, lay bits into the 16×16 grid
    ├── occupancy.py           Step 5  find text / images / drawings / scan ink
    ├── placement.py           Step 6  tile the page, drop dots that collide
    ├── renderer.py            Step 7  write yellow dots into the PDF
    ├── pipeline.py            glue: encode_pdf() + reports
    └── __main__.py            the `netra-encode` command
```

### Libraries

| Library | Where | Why this one |
|---|---|---|
| `hmac`, `hashlib` (standard library) | payload.py | Audited HMAC-SHA256; no third-party crypto needed. |
| **reedsolo** | fec.py | Pure-Python, well-tested Reed-Solomon over GF(2⁸); supports erasures, which the decoder relies on. |
| **NumPy** | everywhere | Bit packing, tile matrices, 50k-point collision tests, coordinate transforms. |
| **PyMuPDF** (`pymupdf`) | occupancy, renderer, pipeline | Reads page words/images/drawings, rasterises pages, writes raw drawing commands. Fast (C core, MuPDF). |
| **OpenCV** (`cv2`) | occupancy | Morphology and connected components to locate ink on scanned pages. |

---

## 4. Configuration — one source of truth

**File:** `core/config.py` — the frozen dataclass `StegConfig`.

The encoder and the decoder import the same object, so they can never disagree
about the format. `frozen=True` means it cannot be changed by accident at
runtime; a variant is created with `dataclasses.replace(...)` (the CLI does this
for `--ink`).

| Field | Value | Meaning |
|---|---|---|
| `grid_size` | 16 | Tile is 16 × 16 = 256 cells |
| `payload_len` | 16 | ID length in bytes (NUL-padded) |
| `tag_len` | 4 | HMAC bytes kept |
| `rs_nsym` | 8 | Reed-Solomon parity bytes |
| `interleave_prime` | 5 | Shuffle stride |
| `tile_version` / `meta_bits` | 1 / 4 | Format version, stored in 4 cells |
| `control` | (1,0,1,1) | Fixed known pattern, 4 cells |
| `pitch_pt` | 2.4 | Distance between neighbouring cells |
| `dot_r` / `pilot_r` | 0.4 / 0.6 | Dot radius / pilot radius |
| `tile_gap_pt` | 4.8 | Empty gap between neighbouring tiles |
| `page_margin_pt` | 18 | 0.25-inch printer-safe margin |
| `text_pad_pt` | 3 | Keep-away border around content |
| `p4_reserve_pitch` | 0.75 | Cells within 0.75 pitch of pilot P4 are left empty |
| `ignore_drawing_area_frac` | 0.5 | Objects larger than half the page are not obstacles |
| `raster_dpi` / `raster_ink_frac` / `raster_join_pt` | 100 / 0.7 / 3 | Scan-ink detection settings |
| `pilots` | (0,0) (1,0) (0,1) (0.73,0.61) | Pilot positions, as fractions of the tile |
| `color_cmyk` | (0,0,1,0) | Pure yellow |

**Derived properties** (computed, never stored, so they cannot go out of sync):

```
packet_len   = 16 + 4          = 20 bytes
n_symbols    = 20 + 8          = 28 bytes
n_data_bits  = 28 × 8          = 224 bits
n_cells      = 16 × 16         = 256
tile_size_pt = (16 + 1) × 2.4  = 40.8 pt   (14.4 mm)
tile_step_pt = 40.8 + 4.8      = 45.6 pt
```

**Validation** in `__post_init__` rejects impossible formats when the config is
created:

- interleave stride must share no factor with 28 (`gcd(5, 28) = 1` ✓; 7 would fail);
- the version must fit in 4 bits;
- 224 data bits + 4 meta + 4 control must fit in the grid (a 14×14 grid has only
  196 cells → rejected — this is why the format uses 16×16);
- dots must not touch: `2 × 0.4 = 0.8 < 2.4` ✓.

**Secret key.** `resolve_secret()` returns the HMAC key in this order:

1. the `secret=` argument, if given;
2. the `NETRA_STEG_SECRET` environment variable;
3. the nearest `.env` file (searched upward from the current folder, then from
   the package folder, which finds `backend/.env`), loaded with
   `python-dotenv` without overriding existing variables.

It must be at least 16 bytes, otherwise `ConfigError`.

---

## 5. Step 1 · Payload and HMAC tag (`payload.py`)

### 5.1 `serialize_payload(text)` — text to exactly 16 bytes

Checks, in order:

| Check | Rejected example |
|---|---|
| must be `str` | `1007` (an int) |
| must not be empty | `""` |
| at most 16 characters | `"X" * 17` |
| printable ASCII only (codes 32–126) | `"CIDé1007"`, `"CID\n1007"` |

Then `text.encode("ascii").ljust(16, b"\x00")` converts and pads:

```
"CID1007_23:48:56" → 67 73 68 49 48 48 55 95 50 51 58 52 56 58 53 54      (already 16)
"CID1"             → 67 73 68 49  0  0  0  0  0  0  0  0  0  0  0  0      (12 NUL bytes added)
```

Why fixed length: the tile has a fixed number of cells, so every payload must
take exactly the same space. NUL (byte 0) is not a printable character, so the
decoder can strip it unambiguously.

### 5.2 `compute_tag(key, payload)` — the authentication tag

```python
digest  = hmac.new(key, payload, hashlib.sha256).digest()      # 32 bytes
tag_int = int.from_bytes(digest, "big") % (1 << 32)            # keep the low 32 bits
return tag_int.to_bytes(4, "big")                              # 4 bytes
```

"mod 2³²" of a big-endian number is simply its **last 4 bytes**:

```
HMAC-SHA256 = 0fddd44cde237e9f … 6dad553f b4230dfc     (demo key)
tag         =                             b4 23 0d fc  = 180 35 13 252
```

### 5.3 `build_packet` — payload ‖ tag

```
[67 73 68 49 48 48 55 95 50 51 58 52 56 58 53 54 | 180 35 13 252]   20 bytes
```

**Why HMAC and not a plain checksum?** A checksum (CRC) can be recomputed by
anyone, so a forger could stamp a fake ID. HMAC requires the secret key; without
it, a forger's chance of guessing a valid 4-byte tag is 1 in 2³² ≈ 4.3 billion.
The decoder also uses the tag as a *referee*: if error correction produces a
candidate ID whose tag does not verify, the candidate is rejected.

**Why only 4 bytes?** Every byte costs 8 cells. 4 bytes gives strong enough
forgery resistance for this purpose while leaving room for error correction.

---

## 6. Step 2 · Reed-Solomon error correction (`fec.py`)

### 6.1 The idea

Reed-Solomon (RS) treats each byte as a *symbol* and computes extra **parity**
symbols from the data. Here: 20 data symbols + 8 parity = 28, written RS(28, 20).

It is **systematic**: the original 20 bytes appear unchanged at the front, parity
is appended.

```
codeword = [67 73 68 … 54 180 35 13 252 | 142 187 140 253 83 254 16 134]
            └──────── packet (20) ───────┘ └──────── parity (8) ────────┘
```

### 6.2 What it can repair

Two kinds of damage:

- **error** — a byte is wrong and the decoder does *not* know which one;
- **erasure** — a byte is unreadable and the decoder *knows* its position
  (e.g. the cells were hidden under text).

The rule is **2E + R ≤ 8** (E errors, R erasures):

| Errors E | Erasures R | 2E + R | Recoverable? |
|---|---|---|---|
| 4 | 0 | 8 | ✓ |
| 0 | 8 | 8 | ✓ |
| 2 | 4 | 8 | ✓ |
| 0 | 9 | 9 | ✗ |

An erasure is half the cost of an error because the decoder does not have to
work out *where* the damage is. This is why the encoder carefully records which
cells it suppressed — the decoder turns them into erasures.

### 6.3 The code

```python
@lru_cache(maxsize=8)
def rs_codec(nsym): return RSCodec(nsym)       # build the codec once, reuse it

def rs_encode(packet, nsym):
    return list(rs_codec(nsym).encode(bytes(packet)))
```

`RSCodec(8)` uses the standard parameters: arithmetic in GF(2⁸) (a number system
with exactly 256 values where addition is XOR), primitive polynomial `0x11d`,
generator α = 2. The decoder uses the same codec, so parity always matches.

`lru_cache` avoids rebuilding the codec's lookup tables on every call.

---

## 7. Step 3 · Interleaving (`core/interleaver.py`)

### 7.1 The problem it solves

Neighbouring bytes end up as neighbouring cells on paper. A single pen stroke
could destroy 3–4 neighbouring bytes at once (a **burst**). Burst errors are the
most common physical damage.

### 7.2 The rule

```
out[k] = in[(k × 5) mod 28]
```

| k | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | … |
|---|---|---|---|---|---|---|---|---|---|
| source index | 0 | 5 | 10 | 15 | 20 | 25 | 2 | 7 | … |
| value | 67 | 48 | 58 | 54 | 142 | 254 | 68 | 95 | … |

Full result:

```
67 48 58 54 142 254 68 95 56 35 140 134 48 51 53 252 83 73 55 52 180 187 16 49 50 58 13 253
```

Because `gcd(5, 28) = 1`, the sequence visits every index exactly once — it is a
**permutation**, so nothing is lost or duplicated.

A burst hitting tile positions 10, 11, 12, 13 actually damages codeword bytes
22, 27, 4, 9 → sorted 4, 9, 22, 27: four *separate* errors spread across the
codeword. Reed-Solomon counts errors per symbol, so it does not care that they
were physically adjacent — but other layers of the decoder (soft fusion,
erasure decisions) benefit from damage being spread out.

### 7.3 The functions

| Function | Purpose |
|---|---|
| `permutation(n, p)` | The list of source indices; raises if `gcd(p, n) ≠ 1`. |
| `interleave(symbols, p)` | Shuffle (encoder). |
| `deinterleave(symbols, p)` | Exact inverse (decoder, and the encoder self-check). |
| `deinterleave_positions(pos, n, p)` | Map damaged tile positions back to codeword positions (decoder erasures). |

---

## 8. Step 4 · Bits and the 16×16 tile (`bits.py`, `core/layout.py`, `tile.py`)

### 8.1 Bytes → bits (`bits.py`)

```python
np.unpackbits(np.frombuffer(bytes(data), np.uint8))   # MSB first
```

```
67 → 0 1 0 0 0 0 1 1
48 → 0 0 1 1 0 0 0 0
58 → 0 0 1 1 1 0 1 0
…  28 bytes × 8 = 224 bits
```

`bits_to_bytes` (`np.packbits`) is the inverse; `int_to_bits(1, 4)` → `[0,0,0,1]`
is used for the version.

### 8.2 Cell geometry (`layout.py`)

The tile has a **pilot frame** with the cell grid inside it:

```
P1 ●─────────────────────────────────● P2        P1 = (0, 0)       pt
   │ (0,0)  (0,1)  …           (0,15) │           P2 = (40.8, 0)
   │   ·      ·                  ·    │           P3 = (0, 40.8)
   │   …                  ● P4        │           P4 = (29.78, 24.89)
   │   ·      ·                  ·    │
   │ (15,0)               (15,15)     │
P3 ●─────────────────────────────────┘           no pilot bottom-right
```

- cell (r, c) centre = `((c + 1) × 2.4, (r + 1) × 2.4)` pt from P1
  → cell (0,0) at (2.4, 2.4), cell (15,15) at (38.4, 38.4);
- frame side = `(16 + 1) × 2.4 = 40.8` pt, so the corner pilots sit one pitch
  away from the nearest cell and never touch one.

`cell_offsets_pt` builds all 256 centres with `np.meshgrid`; `pilot_offsets_pt`
multiplies the normalised pilot table by 40.8.

**Why 3 corner pilots + 1 off-grid pilot?** Three corners define position,
scale and rotation. But a square looks the same rotated by 90°; leaving the 4th
corner empty and adding **P4 at an asymmetric spot (0.73, 0.61)** makes every
orientation — including a mirror image — distinguishable.

### 8.3 Cell roles (`layout.py`)

Every cell gets exactly one job (`CellRole`):

| Role | Count | Where | Purpose |
|---|---|---|---|
| META | 4 | (0,0)–(0,3) | Format version (`0001`) |
| CONTROL | 4 | (15,12)–(15,15) | Fixed `1011`: lets the decoder check orientation and calibrate what "dot" and "no dot" look like |
| RESERVED | 2 | (9,11), (9,12) | Too close to P4; always empty so the pilot is never confused with a data dot |
| DATA | 224 | row-major in the remaining cells | The 224 codeword bits |
| REPEAT | 22 | the leftover cells (14,6)–(15,11) | Copy of data bits 0–21 |

**How `roles` is built:**

1. Fill META and CONTROL cells.
2. RESERVED = cells whose centre is closer than `0.75 × 2.4 = 1.8 pt` to P4:
   - (9,11) at (28.8, 24.0): distance 1.33 pt → reserved;
   - (9,12) at (31.2, 24.0): 1.67 pt → reserved;
   - (10,11) at (28.8, 26.4): 1.80 pt → not < 1.8, stays free.
3. Walk all remaining cells in reading order (row 0 left→right, then row 1, …).
   The first 224 become DATA; the rest (256 − 4 − 4 − 2 − 224 = 22) become REPEAT.

Total: 4 + 4 + 2 + 224 + 22 = **256** ✓. If a config change made something not
fit or overlap, `ConfigError` is raised.

**About the META bits.** 4 bits can only hold 16 values (0–15), so they cannot
carry data — they store the **format version**. If the format ever changes
(bigger grid, longer ID, stronger RS), old printed papers still exist; the
decoder reads the version first and knows which rules apply. They are not inside
the RS codeword, but every tile on the page carries the same 4 bits, so the
decoder averages ~200 copies.

**Why REPEAT?** The cells would otherwise be wasted. Copying the first 22 bits
gives a second chance for bytes 0–2 (and part of byte 3) of the interleaved
stream if their main cells are hidden.

### 8.4 Building the tile (`tile.py`)

```python
interleaved = interleave(codeword, 5)
data_bits   = bytes_to_bits(interleaved)                  # 224 bits
matrix = np.zeros((16, 16), np.uint8)
_place(matrix, layout.data_cells,    data_bits)
_place(matrix, layout.repeat_cells,  data_bits[:22])
_place(matrix, layout.meta_cells,    int_to_bits(1, 4))   # 0 0 0 1
_place(matrix, layout.control_cells, (1, 0, 1, 1))
# RESERVED stay 0
```

`_place` uses NumPy **fancy indexing**: `matrix[[r0, r1, …], [c0, c1, …]] = bits`
writes all bits in one assignment.

The resulting tile (demo key, 1 = dot):

```
        col: 0 1 2 3 4 5 6 7 8 9 A B C D E F
row  0:      0 0 0 1 0 1 0 0 0 0 1 1 0 0 1 1    META 0001 | 01000011 = 67 'C' | 0011…
row  1:      0 0 0 0 0 0 1 1 1 0 1 0 0 0 1 1    …0000 (=48) | 00111010 = 58 | …
row  2:      0 1 1 0 1 0 0 0 1 1 1 0 1 1 1 1
row  3:      1 1 1 0 0 1 0 0 0 1 0 0 0 1 0 1
row  4:      1 1 1 1 0 0 1 1 1 0 0 0 0 0 1 0
row  5:      0 0 1 1 1 0 0 0 1 1 0 0 1 0 0 0
row  6:      0 1 1 0 0 0 1 1 0 0 0 0 0 0 1 1
row  7:      0 0 1 1 0 0 1 1 0 1 0 1 1 1 1 1
row  8:      1 1 0 0 0 1 0 1 0 0 1 1 0 1 0 0
row  9:      1 0 0 1 0 0 1 1 0 1 1 0 0 1 0 0    cols B,C = RESERVED (0 0)
row 10:      1 1 0 1 0 0 1 0 1 1 0 1 0 0 1 0
row 11:      1 1 1 0 1 1 0 0 0 1 0 0 0 0 0 0
row 12:      1 1 0 0 0 1 0 0 1 1 0 0 1 0 0 0
row 13:      1 1 1 0 1 0 0 0 0 0 1 1 0 1 1 1
row 14:      1 1 1 1 0 1 0 1 0 0 0 0 1 1 0 0    last DATA at (14,5) | REPEAT from (14,6): 01000011…
row 15:      1 1 0 0 0 0 0 0 1 1 1 0 1 0 1 1    REPEAT … (15,11) | CONTROL 1011
```

118 cells are `1` → 118 data dots + 4 pilots per intact tile.

### 8.5 Self-check

`read_tile_matrix` reads the DATA cells back, packs bits to bytes and
de-interleaves. `encode_pdf` calls it and refuses to continue if the result is
not identical to the codeword. It costs microseconds and guarantees the layout
is invertible before a single dot is printed.

---

## 9. Step 5 · Occupancy map (`occupancy.py`)

**Goal:** a list of rectangles where dots must *not* go.
**Output:** NumPy array of shape (M, 4), rows `[x0, y0, x1, y1]` in page points
(origin top-left, y downward).

### 9.1 Vector / text pages — `extract_obstacles`

| Source | PyMuPDF call | Example |
|---|---|---|
| Words | `page.get_text("words")` → `(x0, y0, x1, y1, word, …)` | "Physics" → `(72.0, 100.3, 110.5, 112.1)` |
| Images | `page.get_image_info()` → `bbox` | a logo or diagram |
| Vector drawings | `page.get_drawings()` → `rect` | table borders, underlines, answer boxes |
| Annotations | `page.annots()` → `rect` | form fields, stamps |

Anything with area > 50% of the page (`abs(rect)` is the area) is skipped, so a
full-page border, a white background rectangle or a scanned image does not block
the whole page.

Clean-up, all vectorised:

```python
arr = arr[np.all(np.isfinite(arr), axis=1)]           # drop inf/NaN boxes from odd PDFs
arr = [min(x0,x1), min(y0,y1), max(x0,x1), max(y0,y1)] # fix flipped boxes
arr += [-3, -3, +3, +3]                                # 3 pt keep-away border
```

"Physics" becomes `(69.0, 97.3, 113.5, 115.1)`.

### 9.2 Scanned pages — `raster_backgrounds` + `raster_ink_boxes`

A scanned paper is one big picture with no text layer. `raster_backgrounds`
detects it (an image > 50% of the page). Then `raster_ink_boxes` finds the ink
from pixels:

```python
scale = 100 / 72                                         # 100 dpi
pix  = page.get_pixmap(matrix=Matrix(scale, scale), colorspace=csGRAY, alpha=False)
gray = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w)   # ≈ 827 × 1169

white = np.percentile(gray, 90)                          # paper colour, e.g. 240
ink   = gray < 0.7 * white                               # dark pixels = ink
ink   = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((4, 4)))     # letters → words
n, _, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
stats = stats[1:][stats[1:, AREA] >= 2]                  # drop background + scanner dust
boxes = [x, y, x + w, y + h] / scale                     # pixels → points
```

| Technique | What it does here |
|---|---|
| 90th-percentile white | Scans are greyish; the threshold adapts to each scan instead of assuming 255. |
| Morphological close (dilate then erode) | Fills gaps narrower than ~3 pt, so "P h y s i c s" becomes one blob → far fewer boxes. |
| Connected components | Labels each separate ink blob and returns its bounding box and area. |
| Area ≥ 2 | Ignores single-pixel noise. |

If the page has `/Rotate`, the pixmap is in displayed orientation;
`page.derotation_matrix` maps the boxes back to the unrotated space where dots
are drawn. The ink boxes are then padded by 3 pt like everything else.

---

## 10. Step 6 · Placement and collision avoidance (`placement.py`)

Pure NumPy geometry; no PDF access.

### 10.1 `tile_origins` — where tiles go

Per axis:

```python
usable = extent - 2 * (margin + pilot_r)          # inside the margins
n      = (usable - tile_size) // step + 1         # whole tiles that fit
span   = tile_size + (n - 1) * step
start  = margin + pilot_r + (usable - span) / 2   # centre the block
```

A4 width 595: usable 557.8 → n = 12 → span 542.4 → start 26.3 → x = 26.3, 71.9,
117.5, … A4 height 842: n = 17, start 35.8.
`np.meshgrid` combines them: **12 × 17 = 204 tile origins**.

### 10.2 All candidate positions at once

```python
cell_pts  = origins[:, None, :] + cell_offsets.reshape(1, 256, 2)   # (204, 256, 2)
pilot_pts = origins[:, None, :] + pilot_offsets[None]               # (204, 4, 2)
```

Broadcasting adds every origin to every offset: 52,224 cell positions and 816
pilot positions without a Python loop. Example: tile 0, cell (0,4) →
(26.3 + 12.0, 35.8 + 2.4) = (38.3, 38.2).

### 10.3 `collides` — disc vs box

A disc of radius r touches a box if its centre is inside the box grown by r:

```python
inside = (px >= x0 - r) & (px <= x1 + r) & (py >= y0 - r) & (py <= y1 + r)   # (P, M)
hit    = inside.any(axis=1)                                                  # (P,)
```

Points are column vectors `(P, 1)` and boxes row vectors `(1, M)`, so NumPy
builds the whole P × M truth table. To bound memory it processes 8,192 points at
a time (`_CHUNK`): 8,192 × 2,000 boxes ≈ 16 MB instead of ≈ 100 MB for all
points.

(Growing the box by r is slightly conservative at the corners — it may skip a
dot that would actually just miss. That is the safe direction.)

### 10.4 Deciding what to draw

```python
cell_hit  = collides(cells,  obstacles, 0.4)        # (204, 16, 16)
pilot_hit = collides(pilots, obstacles, 0.6)        # (204, 4)
cell_visible = ~cell_hit & ~reserved
draw  = cell_visible & tile_matrix.astype(bool)     # bit=1 AND not hidden AND not reserved
dots  = cell_pts[draw]                              # (N, 2) final dot centres
pilots = pilot_pts[~pilot_hit]
```

| Cell | Result |
|---|---|
| bit 1, free space | dot drawn |
| bit 0 | nothing drawn |
| bit 1 or 0, under content | **suppressed** — the decoder treats it as unknown (erasure) |
| RESERVED | never drawn |

### 10.5 `_self_decodable` — quality report

For each tile: "could the decoder recover the ID from this tile alone?"

```python
bit_ok = visible[data_cells]                       # (204, 224)
bit_ok[:, :22] |= visible[repeat_cells]            # repeat copy can rescue bits 0–21
symbol_ok = bit_ok.reshape(204, 28, 8).all(axis=2) # a byte needs all 8 bits
erased = 28 - symbol_ok.sum(axis=1)
ok = (erased <= 8) & control_visible & pilots_visible
```

The decoder does not need any single complete tile (it fuses many), but this
number shows how robust each page is.

`PagePlan` holds `origins`, `dots`, `pilots`, the visibility masks and
properties `n_tiles`, `cells_suppressed`, `intact_tiles`.

---

## 11. Step 7 · Vector rendering (`renderer.py`)

### 11.1 One dot = a zero-length line with round caps

PDF has no circle operator; a Bézier circle costs about 150 bytes. Instead:

> A line from P to the same P, stroked with **round line caps**, paints a filled
> disc whose diameter equals the line width (PDF specification).

Each dot is about 25 bytes in the content stream:

```
38.3 803.8 m
38.3 803.8 l
```

### 11.2 `_stroke_points` — every dot in one pass

```python
m = shape.ipctm                                             # page space → PDF space
pdf_pts = points @ [[m.a, m.b], [m.c, m.d]] + [m.e, m.f]    # one matrix multiply
shape.draw_cont += "".join(f"{x:g} {y:g} m\n{x:g} {y:g} l\n" for x, y in pdf_pts)
shape.last_point = None
shape.rect = bbox ∪ shape.rect
shape.finish(color=color, width=2 * radius, lineCap=1, closePath=False)
```

| Line | Why |
|---|---|
| `ipctm` | PyMuPDF measures y downward from the top; native PDF measures y upward from the bottom, possibly with rotation/cropbox. This matrix converts; on unrotated A4, `y_pdf = 842 − y`. |
| matrix multiply | Converts all points at once. |
| `draw_cont +=` | Writes raw commands in one string. The earlier `shape.draw_line(p, p)` per dot spent ~90% of encode time on per-point objects; this gave a ~4× speed-up. |
| `last_point`, `rect` | Bookkeeping that `draw_line` would normally update. |
| `finish(...)` | Adds `0.8 w` (width), `1 J` (round cap), `0 0 1 0 K` (CMYK yellow stroke) and `S` once for the whole batch. |

Called twice: data dots (r 0.4 → width 0.8 pt) and pilots (r 0.6 → width 1.2 pt).

### 11.3 `render_dots` — colour and layer

```python
color, scale = (magenta_rgb, 2.0) if debug else (cmyk_yellow, 1.0)
shape = page.new_shape()
_stroke_points(shape, dots,   0.4 * scale, color)
_stroke_points(shape, pilots, 0.6 * scale, color)
shape.commit(overlay=overlay)
```

- `overlay=False` (normal PDFs): commands are placed **before** the existing
  content, so the page text is painted on top of the dots.
- `overlay=True` (scanned pages): the scan is an opaque full-page image; dots
  painted before it would be hidden, so they are painted after. They still avoid
  all ink because of Step 5.
- `debug=True`: large magenta RGB dots to inspect the pattern on screen.

---

## 12. The pipeline, the report and the CLI

### 12.1 `encode_pdf` (`pipeline.py`)

```python
key      = resolve_secret(secret)
packet   = build_packet(payload, key)            # Step 1
codeword = rs_encode(packet, 8)                  # Step 2
tile     = build_tile_matrix(codeword)           # Steps 3–4
assert read_tile_matrix(tile.matrix) == codeword # self-check

doc = _open(source)                              # bytes or path; rejects non-PDF / encrypted
for each selected page:
    obstacles = extract_obstacles(page)          # Step 5
    plan      = plan_page(w, h, tile.matrix, obstacles)   # Step 6
    scanned   = bool(raster_backgrounds(page))
    render_dots(page, plan.dots, plan.pilots, overlay=scanned)   # Step 7
    report.pages.append(PageReport(...))
out = doc.tobytes(garbage=3, deflate=True)       # clean up unused objects, compress streams
```

Steps 1–4 run **once**; Steps 5–7 run **per page**. The `pages=` argument
selects specific pages.

### 12.2 Reports

`PageReport`: `tiles`, `dots_drawn`, `pilots_drawn`, `cells_suppressed`,
`intact_tiles`, `self_decodable_tiles`, `scanned`, and `dots` (coordinates, kept
for tests, excluded from JSON).
`EncodeReport`: payload, `codeword_hex`, version, debug flag, pages, totals;
`to_dict()` produces the JSON written by `--report`.

### 12.3 CLI (`__main__.py`)

```bash
netra-encode in.pdf out.pdf --payload CID1007_23:48:56 [--secret KEY] [--debug] [--report r.json] [--ink 1.0]
# or
python -m forensic_steganography.encoder in.pdf out.pdf --payload CID1007_23:48:56
```

- `--ink` (0.05–1.0) sets yellow strength via `dataclasses.replace`; below 1.0
  phone-photo detection fails in simulation, scans still work.
- Exit code 0 on success, 1 on `StegError` / missing file; prints one line per
  page.

---

## 13. End-to-end worked example

Payload `CID1007_23:48:56`, demo key `demo-key-0123456789abcdef` (not the real
key), the test-suite A4 page (text block in the upper half plus a rule).

| Stage | Result |
|---|---|
| Payload bytes | `67 73 68 49 48 48 55 95 50 51 58 52 56 58 53 54` |
| HMAC tag | `180 35 13 252` (`b4230dfc`) |
| Parity | `142 187 140 253 83 254 16 134` |
| Interleaved | `67 48 58 54 142 254 68 95 …` |
| Tile | 118 ones + 4 pilots |
| Tiles on page | 204 |
| Dots drawn | 17,200 |
| Pilots drawn | 571 of 816 |
| Cells suppressed | 14,725 |
| Self-decodable tiles | 124 of 204 (the rest are under the text block) |
| Output size | ~99 KiB |

With the real key, only the 4 tag bytes and 8 parity bytes change.

---

## 14. Design decisions and why

| Decision | Reason |
|---|---|
| **Yellow, CMYK (0,0,1,0)** | Yellow on white has the lowest visible contrast for the human eye, yet a camera's blue channel sees it as dark. Pure CMYK yellow prints with one ink, no mixing. |
| **16×16 grid** (not 14×14) | 224 data bits + 8 structural cells do not fit in 196 cells. |
| **Erasure-aware RS** | Content always hides some cells; knowing *where* doubles the repair capacity. |
| **Interleaving** | Physical damage comes in bursts. |
| **Asymmetric P4 pilot** | Unique orientation, including mirror images. |
| **Repeat the tile ~200×** | A partial photo still contains whole tiles; the decoder fuses all of them. |
| **Suppress instead of move** | Keeping every dot on its exact lattice position keeps the geometry simple for vision; the decoder turns missing cells into erasures. |
| **Dots under content** | Text always wins visually; the paper's appearance is unchanged. |
| **Zero-length round-cap strokes, batched** | 6× smaller than Bézier circles; ~4× faster encode. |
| **Single `StegConfig`** | Encoder and decoder cannot drift apart. |

---

## 15. Limitations

- Dense pages leave fewer free tiles; very dense pages may have few
  self-decodable tiles (the decoder still fuses partial tiles).
- Printer behaviour (yellow suppression, toner saving, "grayscale" mode) can
  remove the dots; physical print-scan validation is part of Phase 4.
- The 4-byte tag resists forgery but is not a full digital signature.
- Encrypted PDFs are rejected.

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **Cell** | One of the 256 lattice positions in a tile. |
| **Codeword** | The 28 bytes after Reed-Solomon. |
| **Erasure** | A damaged byte whose position is known. |
| **GF(2⁸)** | Arithmetic system with 256 values used by Reed-Solomon. |
| **HMAC** | Keyed hash used for authentication. |
| **Interleaver** | A fixed shuffle that spreads neighbouring bytes apart. |
| **Pilot** | A larger dot at a known position, used to locate and orient a tile. |
| **Pitch** | Centre-to-centre cell spacing (2.4 pt). |
| **Suppressed cell** | A cell not drawn because it would touch page content. |
| **Systematic code** | Original data appears unchanged inside the codeword. |
| **Tile** | The 16×16 pattern plus 4 pilots (40.8 pt square). |
