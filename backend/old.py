from langchain.tools import tool



@tool 
def generate_question(topic: str, context: str) -> str:
    """Generates a question based on the given topic and context."""
    
    # mokup call to LLM to generate question, gemini
    
    prompt = f"Generate a guiding question to probe user knowledge about {topic} based on the following context: {context}"
    
    output = "Question 1 about " + topic  # Mocked output from LLM
    
    return output


@tool 
def check_claim(question: str, answer: str, context: str) -> str:
    """Check the user's claim against the context and provides feedback."""
    
    # mokup call to LLM to check answer, gemini 
    # should be a structured output
    
    prompt = f"Check the following claim: '{answer}' for the question: '{question}' and if possible focus on the context : '{context}'. If correct output OK, if incorrect output possible improvement be sinthetic, if partially incorrect or imprecise, flag as IMPRECISE and provide feedback basd on context to what is to be improved."
    
    output = "The answer is correct."  # Mocked output from LLM
    
    return output


@tool 
def parse_answer(answer: str) -> str:
    """Parses the user's answer to extract key information, return JSON."""
    
    # mokup call to LLM to parse answer, gemini
    
    prompt = f"Parse the following answer: '{answer}' and extract key claims in a structured format."
    
    output = {"key_claims": "Extracted claims from the answer."}  # Mocked output from LLM
    
    return output
