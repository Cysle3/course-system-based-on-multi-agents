from crewai import Agent, LLM
from dotenv import load_dotenv
import os

load_dotenv()

llm = LLM(
    model="openai/glm-4.7",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

architect_agent = Agent(
    role="Software Architect",
    goal="Design the architecture for the student course selection system",
    backstory=(
        "You are an experienced full-stack software architect "
        "specialized in educational systems."
    ),
    llm=llm,
    verbose=True
)