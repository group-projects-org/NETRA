# NETRA Directory Structure

This document describes the maintained source, test, and configuration layout. Local credentials and generated build or environment artifacts are intentionally excluded.

```text
NETRA/
|-- .github/
|   `-- workflows/
|       `-- ci.yml                          # Continuous integration workflow
|-- .gitignore
|-- LICENSE
|-- README.md
|-- docs/
|   |-- ENCODER.md
|   |-- NETRA-Logo.jpeg
|   `-- directory_structure.md
|-- backend/
|   |-- fastapi-server/
|   |   |-- .env.example
|   |   |-- main.py                         # FastAPI application entry point
|   |   |-- pyproject.toml                  # Python package and CLI metadata
|   |   |-- pytest.ini                      # Python test configuration
|   |   |-- requirements.txt                # Python runtime and test dependencies
|   |   |-- common/
|   |   |   `-- database.py                 # SQLAlchemy/MySQL connection
|   |   |-- routes/
|   |   |   `-- health.py                   # Health check and diagnostic routes
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
|   |       |-- fastapi/
|   |       |   |-- conftest.py
|   |       |   |-- test_database.py
|   |       |   |-- test_endpoints.py
|   |       |   |-- test_health_routes.py
|   |       |   `-- test_main_app.py
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
|       |-- app.js                         # Express application and routes mounting
|       |-- db.js                          # MySQL connection pool
|       |-- index.js                       # HTTP and Socket.IO server entry point
|       |-- package.json
|       |-- package-lock.json
|       |-- test-api.http
|       |-- middleware/
|       |   |-- authMiddleware.js          # JWT authentication middleware
|       |   `-- roleMiddleware.js          # Role-based authorization middleware
|       |-- routes/
|       |   |-- authRoutes.js              # Authentication (Examiner login)
|       |   |-- eventRoutes.js             # Examination events and scheduling
|       |   |-- ExaminerRoutes.js          # Examiner registration and management
|       |   `-- NotificationRoutes.js      # Notifications and real-time broadcasts
|       |-- stochastic-selection/
|       |   |-- index.js                   # Question paper randomized selection
|       |   `-- data/
|       |       |-- blueprint.js           # Topic and difficulty distribution blueprint
|       |       `-- mockQuestion.js        # Question dataset for generation
|       `-- tests/
|           |-- api/
|           |   |-- app.test.js
|           |   `-- routes.test.js
|           |-- middleware/
|           |   |-- authMiddleware.test.js
|           |   `-- roleMiddleware.test.js
|           `-- stochastic-selection/
|               `-- stochastic.test.js
`-- frontend/
    |-- .env.example
    |-- .gitignore
    |-- eslint.config.js
    |-- index.html
    |-- package.json
    |-- package-lock.json
    |-- vite.config.js
    |-- public/
    |   |-- favicon.svg
    |   |-- hero-bg.png
    |   |-- icons.svg
    |   |-- netra.png
    |   `-- netra-login.png
    |-- tests/
    |   |-- setup.js
    |   |-- App.test.jsx
    |   |-- components/
    |   |   |-- AddExaminer.test.jsx
    |   |   |-- Home.test.jsx
    |   |   |-- InfoPages.test.jsx
    |   |   |-- Login.test.jsx
    |   |   `-- ThemeToggle.test.jsx
    |   `-- context/
    |       `-- ThemeContext.test.jsx
    `-- src/
        |-- App.css
        |-- App.jsx
        |-- index.css
        |-- main.jsx
        |-- assets/
        |   |-- hero.png
        |   |-- react.svg
        |   `-- vite.svg
        |-- context/
        |   |-- ThemeContext.jsx
        |   `-- ThemeContextValue.js
        `-- components/
            |-- Home.jsx
            |-- InfoPages.jsx
            |-- Login.jsx
            |-- ThemeToggle.jsx
            |-- admin/
            |   |-- AddExaminer.jsx
            |   |-- AdminDashboard.jsx
            |   |-- AdminProfile.jsx
            |   |-- NotificationsPage.jsx
            |   `-- SchedulePage.jsx
            `-- examiner/
                |-- ExaminationCalendar.jsx
                |-- ExaminerDashboard.jsx
                |-- ExaminerProfile.jsx
                |-- Notifications.jsx
                |-- RecentPapers.jsx
                |-- UpcomingSchedule.jsx
                `-- UploadQuestionPaper.jsx
```

## Component Boundaries

| Component | Responsibility | Primary entry point |
| --- | --- | --- |
| Frontend | React 19 user interface, built with Vite and Tailwind CSS; tests run via Vitest | `frontend/src/main.jsx` |
| Node.js API | Express 5 API with Socket.IO real-time notifications and MySQL backend; tests use Node's built-in test runner | `backend/node-server/index.js` |
| Stochastic Selection | Algorithmic randomized question paper generation conforming to examination blueprints | `backend/node-server/stochastic-selection/index.js` |
| FastAPI application | HTTP API, health checks, and API documentation; tests use pytest | `backend/fastapi-server/main.py` |
| Forensic steganography | PDF watermark encoding, shared configuration, FEC, and CLI | `backend/fastapi-server/forensic_steganography/` |

Both backend services connect to MySQL. The Node and React projects use npm, as indicated by their `package-lock.json` files.

## Local and Generated Artifacts

The following are created locally and are not source-controlled application components: `.env`, `.venv/`, `node_modules/`, `frontend/dist/`, `__pycache__/`, and Python package metadata such as `*.egg-info/`. Use the corresponding `.env.example` files as templates; never place production secrets in this document or commit them.
