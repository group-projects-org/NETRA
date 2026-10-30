# NETRA Directory Structure

This document describes the maintained source, test, and configuration layout. Local credentials and generated build or environment artifacts are intentionally excluded.

```text
NETRA/
|-- LICENSE
|-- README.md
|-- docs/
|   `-- directory_structure.md
|-- backend/
|   |-- fastapi-server/
|   |   |-- .env.example
|   |   |-- main.py                         # FastAPI application entry point
|   |   |-- pyproject.toml                  # Python package and CLI metadata
|   |   |-- pytest.ini                      # Python test configuration
|   |   |-- requirements.txt                # Python runtime and test dependencies
|   |   |-- routes/                         # Reserved for FastAPI route modules
|   |   |-- forensic_steganography/
|   |   |   |-- __init__.py
|   |   |   |-- core/
|   |   |   |   |-- __init__.py
|   |   |   |   |-- config.py
|   |   |   |   |-- errors.py
|   |   |   |   |-- interleaver.py
|   |   |   |   `-- layout.py
|   |   |   `-- encoder/
|   |   |       |-- __init__.py
|   |   |       |-- __main__.py             # netra-encode CLI entry point
|   |   |       |-- bits.py
|   |   |       |-- fec.py
|   |   |       |-- occupancy.py
|   |   |       |-- payload.py
|   |   |       |-- pipeline.py
|   |   |       |-- placement.py
|   |   |       |-- renderer.py
|   |   |       `-- tile.py
|   |   `-- tests/
|   |       |-- __init__.py
|   |       `-- forensic_steganography/
|   |           |-- __init__.py
|   |           |-- conftest.py
|   |           |-- test_fec.py
|   |           |-- test_interleaver.py
|   |           |-- test_layout.py
|   |           |-- test_payload.py
|   |           |-- test_pipeline.py
|   |           `-- test_tile.py
|   `-- node-server/
|       |-- .env.example
|       |-- db.js                          # MySQL connection pool
|       |-- index.js                       # Express application entry point
|       |-- package.json
|       |-- package-lock.json
|       |-- test-api.http
|       `-- routes/
|           |-- authRoutes.js
|           `-- ExaminerRoutes.js
`-- frontend/
    |-- eslint.config.js
    |-- index.html
    |-- package.json
    |-- package-lock.json
    |-- vite.config.js
    |-- public/
    `-- src/
        |-- App.css
        |-- App.jsx
        |-- index.css
        |-- main.jsx
        |-- assets/
        |-- context/
        |   `-- ThemeContext.jsx
        `-- components/
            |-- Home.jsx
            |-- InfoPages.jsx
            |-- Login.jsx
            |-- ThemeToggle.jsx
            |-- admin/
            |   |-- AddExaminer.jsx
            |   |-- AdminDashboard.jsx
            |   |-- AdminProfile.jsx
            |   |-- CalendarPage.jsx
            |   |-- NotificationsPage.jsx
            |   `-- SchedulePage.jsx
            `-- examiner/
                |-- ExaminationCalendar.jsx
                |-- ExaminerDashboard.jsx
                |-- ExaminerProfile.jsx
                |-- Notifications.jsx
                |-- RecentPapers.jsx
                `-- UpcomingSchedule.jsx
```

## Component Boundaries

| Component | Responsibility | Primary entry point |
| --- | --- | --- |
| Frontend | React user interface, served and built with Vite | `frontend/src/main.jsx` |
| Node.js API | Express routes and MySQL-backed examiner operations | `backend/node-server/index.js` |
| FastAPI application | HTTP API, health checks, and API documentation | `backend/fastapi-server/main.py` |
| Forensic steganography | PDF watermark encoding, shared configuration, and CLI | `backend/fastapi-server/forensic_steganography/` |

## Local and Generated Artifacts

The following are created locally and are not source-controlled application components: `.env`, `.venv/`, `node_modules/`, `frontend/dist/`, `__pycache__/`, and Python package metadata such as `*.egg-info/`. Use the corresponding `.env.example` files as templates; never place production secrets in this document or commit them.