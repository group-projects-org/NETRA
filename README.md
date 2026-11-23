# NETRA

**N.E.T.R.A. (Nodal Encrypted Transmission & Retrieval for Assessments)** is a zero-trust, just-in-time secure examination printing and forensic leak-attribution system. It brings cryptographic controls used in computer-based testing to traditional paper examinations.

## Repository Layout

The repository contains a React frontend, a Node.js/MySQL API, and a Python FastAPI and forensic-steganography service. See [docs/directory_structure.md](docs/directory_structure.md) for the source and configuration layout.

## Prerequisites

- Git
- Node.js and npm (use a supported Node.js LTS release)
- Python 3.11 or later and pip
- MySQL Server for the Node.js API

The Node.js API expects a MySQL database and an `examiners` table. This repository does not currently include database migrations or a schema initialization script; provision the database schema before using examiner authentication or administration endpoints.

## Setup

Each component has its own dependencies and can be installed independently. Run each service in a separate terminal from its stated working directory.

### Frontend

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Vite prints the local URL when it starts (normally `http://localhost:5173`). Set `VITE_NODE_API_URL` and `VITE_FASTAPI_API_URL` in `frontend/.env` to the deployed API origins; the example uses the local development addresses.

### Node.js API Server

```powershell
cd backend/node-server
npm ci
Copy-Item .env.example .env
```

Edit `backend/node-server/.env` with the MySQL connection details, desired API port, `FRONTEND_URL`, and `FASTAPI_API_URL`. `FRONTEND_URL` controls the browser origin allowed by CORS. Start the server with:

```powershell
npm run dev
```

Use `npm start` for a non-watch run. The root endpoint is `http://localhost:5001/`; the database health endpoint is `http://localhost:5001/api/health/db`.

### FastAPI Application

Create an isolated Python environment and install the backend dependencies:

```powershell
cd backend/fastapi-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `FRONTEND_URL` and `NODE_API_URL` in `backend/fastapi-server/.env` to the deployed frontend and Node.js API origins. The FastAPI application does not require the MySQL configuration used by the Node.js API. Start it from `backend/fastapi-server`:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify the service at `http://localhost:8000/` or `http://localhost:8000/health`. Interactive API documentation is available at `http://localhost:8000/docs`.

### Forensic Steganography

The forensic-steganography package uses the same Python environment and dependency installation as the FastAPI application. Set a private `NETRA_STEG_SECRET` value of at least 16 bytes in `backend/fastapi-server/.env` before encoding. Do not commit populated `.env` files.

From `backend/fastapi-server`, run the encoder with either installed console command or Python module:

```powershell
netra-encode input.pdf output.pdf --payload CID1007_23:48:56
```

```powershell
python -m forensic_steganography.encoder input.pdf output.pdf --payload CID1007_23:48:56
```

`requirements.txt` installs the package in editable mode, making the `netra-encode` command available in the active environment. The payload must be ASCII and no longer than 16 characters. For available options, run `netra-encode --help`.

### Secure Document Processing

The secure-document package provides chunked AES-256-GCM container encryption and authenticated in-memory PDF rendering without writing unencrypted documents to disk. It uses the same Python environment and dependency installation as the FastAPI application.

Set an encryption key in `backend/fastapi-server/.env` via `NETRA_DOCUMENT_KEY` or pass `--key` (32-byte raw string or 64-character hex):

```powershell
# Generate a 32-byte AES key
netra-secure-doc keygen
```

From `backend/fastapi-server`, encrypt a PDF with either the console command or Python module:

```powershell
netra-secure-doc encrypt input.pdf output.ntr --key <KEY>
```

```powershell
python -m secure_document encrypt input.pdf output.ntr --key <KEY>
```

Inspect or render a page in RAM to verify container integrity and in-memory rasterization (pass `--output` to save a PNG preview image):

```powershell
netra-secure-doc inspect output.ntr --key <KEY>
netra-secure-doc render output.ntr --output page0.png --page 0 --dpi 150 --key <KEY>
```

To decrypt an `.ntr` file back to a PDF:

```powershell
netra-secure-doc decrypt output.ntr decrypted.pdf --key <KEY>
```

`requirements.txt` installs the package in editable mode, making the `netra-secure-doc` command available in the active environment. For available options, run `netra-secure-doc --help`.

## Verification

Run the Python test suite from `backend/fastapi-server`. This runs both the FastAPI endpoint tests and the forensic-steganography tests, and reports Python source coverage:

```powershell
python -m pytest
```

Run the Node.js API tests and coverage from `backend/node-server`:

```powershell
npm test
npm run test:coverage
```

Run frontend tests, lint, and a production build from `frontend`:

```powershell
npm test
npm run test:coverage
npm run lint
npm run build
```

Each package measures its own source with its language's coverage tool. The Python, Node.js, and frontend reports are separate (`coverage.xml` for Python and `coverage/lcov.info` for JavaScript); CI can upload all three to a coverage service for a combined repository view. Coverage includes executed source paths, not dependencies or generated output, and does not imply every source line is tested.

## Environment and Generated Files

Create local `.env` files from the checked-in `.env.example` files and keep credentials out of version control. The local virtual environment, `node_modules`, frontend build output (`frontend/dist/`), Python cache files, and package build metadata are generated artifacts and are not part of the source layout.
