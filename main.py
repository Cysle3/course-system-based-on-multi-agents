from crewai import Task, Crew

from agents.pm_agent import pm_agent
from agents.architect_agent import architect_agent
from agents.programmer_agent import programmer_agent

# =========================
# STEP 1: PM AGENT
# =========================

pm_task = Task(
    description="""
    Design the requirements for a student course selection system.

    The system should include:
    1. Student course browsing
    2. Course selection
    3. Course dropping
    4. Admin course management
    5. Course conflict handling

    Output:
    - Functional requirements
    - User stories
    - User roles
    - MVP feature list

    Use markdown format.
    """,
    expected_output="A complete markdown requirements document",
    agent=pm_agent
)

pm_crew = Crew(
    agents=[pm_agent],
    tasks=[pm_task],
    verbose=True
)

requirements_result = pm_crew.kickoff()

with open("artifacts/requirements.md", "w", encoding="utf-8") as f:
    f.write(str(requirements_result))

print("requirements.md generated successfully!")

# =========================
# READ REQUIREMENTS
# =========================

with open("artifacts/requirements.md", "r", encoding="utf-8") as f:
    requirements_content = f.read()

# =========================
# STEP 2: ARCHITECTURE DESIGN
# =========================

architecture_task = Task(
    description=f"""
    Based on the following software requirements:

    {requirements_content}

    Design the overall software architecture.

    Include:
    1. System architecture
    2. Backend modules
    3. Frontend modules
    4. Technology stack
    5. Course conflict handling logic

    Use markdown format.
    """,
    expected_output="A complete architecture design document",
    agent=architect_agent
)

architecture_crew = Crew(
    agents=[architect_agent],
    tasks=[architecture_task],
    verbose=True
)

architecture_result = architecture_crew.kickoff()

with open("artifacts/architecture.md", "w", encoding="utf-8") as f:
    f.write(str(architecture_result))

print("architecture.md generated successfully!")

# =========================
# STEP 3: API DESIGN
# =========================

api_task = Task(
    description=f"""
    Based on the following software requirements:

    {requirements_content}

    Design RESTful APIs for the system.

    Include:
    1. Student APIs
    2. Admin APIs
    3. Request methods
    4. Request parameters
    5. Response examples

    Use markdown format.
    """,
    expected_output="A complete API design document",
    agent=architect_agent
)

api_crew = Crew(
    agents=[architect_agent],
    tasks=[api_task],
    verbose=True
)

api_result = api_crew.kickoff()

with open("artifacts/api_design.md", "w", encoding="utf-8") as f:
    f.write(str(api_result))

print("api_design.md generated successfully!")

# =========================
# STEP 4: DATABASE SCHEMA
# =========================

db_task = Task(
    description=f"""
    Based on the following software requirements:

    {requirements_content}

    Design the SQLite database schema.

    Include tables for:
    1. students
    2. courses
    3. enrollments

    Requirements:
    - Use SQL CREATE TABLE statements
    - Include primary keys
    - Include foreign keys
    - Include course capacity
    - Include course time_slot

    Output only SQL code.
    """,
    expected_output="A complete SQLite schema SQL file",
    agent=architect_agent
)

db_crew = Crew(
    agents=[architect_agent],
    tasks=[db_task],
    verbose=True
)

db_result = db_crew.kickoff()

with open("artifacts/db_schema.sql", "w", encoding="utf-8") as f:
    f.write(str(db_result))

print("db_schema.sql generated successfully!")

print("All architecture artifacts generated successfully!")

with open("artifacts/api_design.md", "r", encoding="utf-8") as f:
    api_design_content = f.read()

with open("artifacts/db_schema.sql", "r", encoding="utf-8") as f:
    db_schema_content = f.read()

with open("skills/fastapi_backend_skill.md", "r", encoding="utf-8") as f:
    backend_skill_content = f.read()

backend_task = Task(
    description=f"""
    Based on the following API design:

    {api_design_content}

    And the following database schema:

    {db_schema_content}

    And the following backend development skill:

    {backend_skill_content}

    Generate a high-quality backend development prompt.

    The prompt should instruct a coding agent to build:

    1. FastAPI backend
    2. SQLite database integration
    3. SQLAlchemy ORM
    4. CRUD operations
    5. Student course selection APIs
    6. Admin management APIs
    7. Course conflict handling

    The generated backend should include:

    - main.py
    - database.py
    - models.py
    - schemas.py
    - crud.py
    - requirements.txt

    The prompt should:
    - Be detailed
    - Be engineering-oriented
    - Be suitable for Codex or coding agents
    - Clearly specify folder structure
    - Clearly specify implementation requirements


    Use markdown format.
    """,
    expected_output="A complete backend generation prompt",
    agent=programmer_agent
)

backend_crew = Crew(
    agents=[programmer_agent],
    tasks=[backend_task],
    verbose=True
)

backend_result = backend_crew.kickoff()

with open("artifacts/backend_prompt.md", "w", encoding="utf-8") as f:
    f.write(str(backend_result))

print("backend_prompt.md generated successfully!")

with open("skills/testing_skill.md", "r", encoding="utf-8") as f:
    testing_skill_content = f.read()

with open("artifacts/api_design.md", "r", encoding="utf-8") as f:
    api_design_content = f.read()

from agents.tester_agent import tester_agent

test_case_task = Task(
    description=f"""
    Based on the following API design:

    {api_design_content}

    And the following testing skill:

    {testing_skill_content}

    Generate comprehensive backend test cases.

    Include:
    1. Authentication tests
    2. Course API tests
    3. Enrollment tests
    4. Conflict handling tests
    5. Admin API tests

    Use markdown format.
    """,
    expected_output="A complete backend testing document",
    agent=tester_agent
)

test_case_crew = Crew(
    agents=[tester_agent],
    tasks=[test_case_task],
    verbose=True
)

test_case_result = test_case_crew.kickoff()

with open("artifacts/test_cases.md", "w", encoding="utf-8") as f:
    f.write(str(test_case_result))

print("test_cases.md generated successfully!")

pytest_task = Task(
    description=f"""
    Based on the following API design:

    {api_design_content}

    And the following testing skill:

    {testing_skill_content}

    Generate a pytest development prompt.

    The prompt should instruct a coding agent to generate:

    tests/
    ├── test_auth.py
    ├── test_courses.py
    └── test_enrollment.py

    Requirements:
    - Use pytest
    - Use FastAPI TestClient
    - Include assertions
    - Include enrollment conflict tests
    - Include authentication tests

    Use markdown format.
    """,
    expected_output="A complete pytest generation prompt",
    agent=tester_agent
)

pytest_crew = Crew(
    agents=[tester_agent],
    tasks=[pytest_task],
    verbose=True
)

pytest_result = pytest_crew.kickoff()

with open("artifacts/pytest_prompt.md", "w", encoding="utf-8") as f:
    f.write(str(pytest_result))

print("pytest_prompt.md generated successfully!")