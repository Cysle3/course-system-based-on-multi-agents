# Backend Testing Skill

## Testing Goals

The testing system should verify:

1. Authentication
2. Course browsing
3. Course enrollment
4. Course dropping
5. Admin course management
6. Conflict handling
7. Capacity validation

## Testing Framework

Use:
- pytest
- FastAPI TestClient

## Required Test Files

tests/
├── test_auth.py
├── test_courses.py
└── test_enrollment.py

## Authentication Tests

Test:
- Successful login
- Invalid login
- JWT token generation
- Protected route access

## Course Tests

Test:
- Get course list
- Get course details
- Admin create course
- Admin delete course

## Enrollment Tests

Test:
- Successful enrollment
- Duplicate enrollment prevention
- Time conflict prevention
- Course capacity validation
- Drop course

## Bug Reporting Rules

If a test fails:
- Explain the issue
- Identify the API endpoint
- Suggest a possible fix

## Code Quality

- Use modular tests
- Use clear assertions
- Use reusable helper functions