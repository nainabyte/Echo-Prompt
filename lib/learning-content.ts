
export interface SuggestionExplanation {
    category: string;
    explanation: string;
    link?: string;
}

export const SUGGESTION_EXPLANATIONS: Record<string, SuggestionExplanation> = {
    "Task is missing.": {
        category: "Task Clarity",
        explanation: "Without a clear task, the AI has to guess your intent. Be explicit about what you want it to do (e.g., 'Summarize', 'Write code', 'Translate')."
    },
    "Task is too short.": {
        category: "Task Clarity",
        explanation: "Short tasks often lead to generic results. Adding details and verbs helps the AI understand the nuance of your request."
    },
    "Task uses generic verbs.": {
        category: "Verbs Matter",
        explanation: "Verbs like 'do' or 'make' are vague. Weak verbs lead to weak output. Strong verbs like 'Analyze', 'Critique', or 'Synthesize' trigger deeper processing."
    },
    "Role is undefined or too vague.": {
        category: "Persona Adoption",
        explanation: "Assigning a role (e.g., 'Senior Engineer') primes the AI to adopt specific vocabulary, biases, and expertise levels suitable for that persona."
    },
    "Context is missing or minimal.": {
        category: "Contextual Grounding",
        explanation: "Context prevents hallucinations. By providing background info or constraints, you narrow the search space and keep the AI focused on relevant details."
    },
    "Output format is unspecified.": {
        category: "Structure Control",
        explanation: "LLMs tend to ramble. Specifying a format (JSON, Table, Bullet Points) forces the model to structure its thinking and makes the output immediately usable."
    },
    "Tone is not set.": {
        category: "Tone Matching",
        explanation: "Tone dictates the 'vibe' of the response. A 'Professional' tone avoids slang, while a 'Witty' tone allows for creativity and engagement."
    }
};

export const PRO_TIPS = [
    "Tip: Use 'Chain of Thought' prompting by asking the model to 'think step-by-step' for complex math or logic problems.",
    "Tip: Providing examples (Few-Shot Prompting) is often more effective than explaining instructions at length.",
    "Tip: Use delimiters like triple quotes (\"\"\") to clearly separate your data from your instructions.",
    "Tip: Iteration is key. Don't expect perfection on the first try. Refine your constraints based on the initial output.",
    "Tip: Telling the AI what NOT to do (Negative Constraints) can be just as important as telling it what to do."
];

export function getExplanation(issue: string): SuggestionExplanation | null {
    return SUGGESTION_EXPLANATIONS[issue] || null;
}

export function getRandomTip(): string {
    return PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)];
}
