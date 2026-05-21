from crewai import Task, Crew
from agents.pm_agent import pm_agent

task = Task(
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

    Save the result as markdown style content.
    """,
    expected_output="A complete markdown requirements document",
    agent=pm_agent
)

crew = Crew(
    agents=[pm_agent],
    tasks=[task],
    verbose=True
)

result = crew.kickoff()

with open("artifacts/requirements.md", "w", encoding="utf-8") as f:
    f.write(str(result))

print("requirements.md generated successfully!")