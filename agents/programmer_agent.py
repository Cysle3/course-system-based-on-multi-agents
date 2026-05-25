from crewai import Agent, LLM
from dotenv import load_dotenv
import os

load_dotenv()

llm = LLM(
    model="openai/glm-4.7",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

programmer_agent = Agent(
    role="Backend Programmer",
    goal="Generate backend development prompts for the course selection system",
    backstory=(
        "You are an experienced FastAPI backend engineer "
        "specialized in educational management systems."
    ),
    llm=llm,
    verbose=True
)