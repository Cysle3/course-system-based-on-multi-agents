from crewai import Agent, LLM
from dotenv import load_dotenv
import os

load_dotenv()

llm = LLM(
    model="openai/glm-4.7",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

tester_agent = Agent(
    role="Software Tester",
    goal="Generate backend test cases and bug reports",
    backstory=(
        "You are an experienced backend QA engineer "
        "specialized in API testing and automated testing."
    ),
    llm=llm,
    verbose=True
)