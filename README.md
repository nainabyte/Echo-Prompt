# EchoPrompt

**The IDE for Prompt Engineering.**  
EchoPrompt is a professional environment to structure, evaluate, and version-control your prompts against massive LLMs like Gemini, Llama, and Qwen.

## Core Features
- **Structured Ideation**: Define Role, Task, Context, and Constraints separately.
- **Semantic Analysis**: Get a logic score (0-100) and auto-refactoring suggestions.
- **Multi-Model Arena**: Test your prompt against multiple models simultaneously.
- **Version Control**: History and Templates ensure you never lose a good prompt.

## User Guide

### 1. Prompt Builder
The heart of the application.
- **Inputs**: Fill in the fields. The "Task" field is mandatory.
- **Generate**: Click "Generate Optimized Prompt" to create a system-instruction-ready block.

### 2. Advanced Mode
Fine-tune the model's behavior.
- **Temperature (0.0 - 1.0)**: 
    - **Low (0.1)**: Deterministic. Good for code/math.
    - **High (0.9)**: Creative. Good for stories/marketing.
- **Max Tokens**: Limits the output length (1000 tokens ≈ 750 words).

### 3. Test Data / Variables
This feature allows you to separate your **Instructions** from your **Content**.

**Why use it?**  
Models perform better when they clearly distinguish between *what to do* (Instructions) and *what to process* (Data).

**How to use:**
1.  **Optimized Prompt (Box 3)**: Contains your instructions (e.g., "Summarize the text...").
2.  **Test Data (Box 4)**: Contains the actual content you want to process.

**Example Scenarios:**

**Scenario A: Summarization**
- **Optimized Prompt**: "Summarize the following article into 3 bullet points. Focus on key financial figures."
- **Test Data**: [Paste a full news article here]

**Scenario B: Code Debugging**
- **Optimized Prompt**: "Analyze the following Python code. Identify logical errors and suggest a fix."
- **Test Data**: 
```python
def add(a, b):
    return a * b  # Intentional error
```

**Scenario C: Data Extraction**
- **Optimized Prompt**: "Extract all email addresses from the text. Return as a JSON array."
- **Test Data**: "Contact us at support@example.com or sales@test.co during business hours."

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **AI Models**: Gemini (via Google AI Studio), HuggingFace Inference
- **Database**: MongoDB (Mongoose)
