from crewai import Task, Crew

from agents.pm_agent import pm_agent
from agents.architect_agent import architect_agent

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