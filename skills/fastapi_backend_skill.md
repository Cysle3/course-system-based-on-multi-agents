# FastAPI Backend Development Skill

## Project Structure

Use the following structure:

backend/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── crud.py
└── requirements.txt

## Technology Stack

- FastAPI
- SQLite
- SQLAlchemy
- Pydantic

## API Rules

- Use RESTful API design
- Use JSON responses
- Use clear route naming

## Database Rules

- Use SQLAlchemy ORM
- Use SQLite database
- Use proper foreign keys

## Business Logic

### Course Selection

- Prevent duplicate enrollment
- Prevent time conflicts
- Check course capacity before enrollment

### Admin Features

- Add courses
- Delete courses
- View enrolled students

## Code Quality

- Separate models and schemas
- Keep CRUD logic in crud.py
- Use comments where necessary
- Keep code modular

## Required APIs

### Student APIs

- GET /courses
- POST /select
- POST /drop
- GET /mycourses

### Admin APIs

- POST /courses
- DELETE /courses/{id}
- GET /courses/{id}/students