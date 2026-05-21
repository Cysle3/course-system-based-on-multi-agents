from crewai import Agent, LLM
from dotenv import load_dotenv
import os

load_dotenv()

llm = LLM(
    model="openai/glm-4.7",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE")
)

pm_agent = Agent(
    role="Product Manager",
    goal="Analyze and design requirements for a student course selection system",
    backstory=(
        "You are an experienced software product manager "
        "specialized in educational systems."
    ),
    llm=llm,
    verbose=True
)