# course-system-based-on-multi-agents

A multi-agent software development system that automatically generates a Student Course Selection System from requirements to deployment.

The project includes a FastAPI backend, a modern React dashboard frontend, automated pytest coverage, and a multi-agent workflow that models product, architecture, implementation, and testing responsibilities.

## Project Overview

`course-system-based-on-multi-agents` demonstrates how a coordinated software-agent workflow can produce a complete web application from high-level requirements.

The generated Student Course Selection System supports student course browsing and enrollment, administrative course management, student schedule review, and automated conflict-aware registration behavior.

Default demo accounts:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin` |
| Student | `student` | `student` |
| Student | `student2` | `student2` |
| Student | `student3` | `student3` |

## System Architecture

```text
course-system-based-on-multi-agents/
├── agents/                 # Multi-agent definitions
├── artifacts/              # Generated requirements, API, schema, and design artifacts
├── backend/                # FastAPI backend application
│   ├── main.py             # API routes, app setup, seed data
│   ├── auth.py             # JWT and password hashing
│   ├── crud.py             # Business logic and database operations
│   ├── database.py         # SQLite and SQLAlchemy session setup
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response models
│   └── requirements.txt
├── frontend/               # React + Vite frontend application
│   └── src/
│       ├── api/            # Axios clients and API helpers
│       ├── components/     # Reusable UI components
│       ├── layouts/        # Dashboard layout
│       ├── pages/          # Student and admin pages
│       └── routes/         # Route configuration
├── tests/                  # Pytest API test suite
├── main.py                 # Multi-agent artifact-generation workflow
└── README.md
```

High-level runtime architecture:

```text
React Frontend
  |
  | Axios + JWT Bearer Token
  v
FastAPI Backend
  |
  | SQLAlchemy ORM
  v
SQLite Database
```

## Multi-Agent Workflow

The project models a practical software delivery pipeline with specialized agents:

| Agent | Responsibility |
| --- | --- |
| Product Manager Agent | Defines product requirements, user stories, roles, and MVP scope |
| Architect Agent | Designs system architecture, API contracts, and database schema |
| Programmer Agent | Converts generated specifications into backend/frontend implementation prompts and code |
| Tester Agent | Produces automated test plans and pytest coverage |

The root `main.py` orchestrates artifact generation for requirements, architecture, API design, and database schema.

## Features

### Student

- Login with JWT authentication
- Browse available courses
- Enroll in course sections
- Drop courses
- View weekly timetable
- View dashboard statistics
- Detect enrolled and full course states in the UI
- Course registration conflict handling

### Admin

- Login with admin role
- Course management
- Create, update, and delete courses/sections
- Student management
- View student timetable
- Drop student enrollments
- Admin dashboard with operational metrics
- Enrollment reports and top-enrolled course visibility

## Technology Stack

### Backend

- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication
- Pydantic
- Pytest

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui style components
- axios
- sonner
- lucide-react

## Installation Guide

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm

Clone the repository:

```bash
git clone <repository-url>
cd course-system-based-on-multi-agents
```

## Running Backend

Install backend dependencies:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

The backend uses SQLite and creates `university.db` automatically. Seed data is idempotent and includes demo users, courses, sections, and sample enrollments.

## Running Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

The frontend API base URL defaults to:

```text
http://127.0.0.1:8000
```

To override it, create a frontend environment file:

```bash
cd frontend
printf 'VITE_API_BASE_URL=http://127.0.0.1:8000\n' > .env
```

## Test Instructions

Run backend tests from the repository root:

```bash
pytest
```

Run a specific test module:

```bash
pytest tests/test_auth.py
pytest tests/test_courses.py
pytest tests/test_enrollment.py
```

The project includes 18+ automated pytest test cases covering authentication, course browsing, admin APIs, enrollment workflows, conflict handling, and delete behavior.

Run frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Screenshots

Add screenshots here after deployment or local UI capture.

### Student Dashboard

```text
docs/screenshots/student-dashboard.png
```

### Course List

```text
docs/screenshots/course-list.png
```

### Weekly Timetable

```text
docs/screenshots/weekly-timetable.png
```

### Admin Dashboard

```text
docs/screenshots/admin-dashboard.png
```

### Student Management

```text
docs/screenshots/student-management.png
```

## Future Improvements

- Add Alembic database migrations
- Add production-grade environment configuration
- Add refresh tokens and session expiration handling
- Add frontend unit and integration tests
- Add e2e tests with Playwright
- Add role-aware backend audit logging
- Add prerequisite completion history instead of simple prerequisite matching
- Add enrollment deadlines and semester support
- Add Docker and Docker Compose deployment
- Add CI pipeline for backend tests and frontend build checks
- Add generated screenshots and deployment documentation

## License

This project is intended to be released under the MIT License.

Add a `LICENSE` file at the repository root before publishing or distributing the project.
