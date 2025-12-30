
export interface PromptInputs {
    role: string;
    task: string;
    context: string;
    tone: string;
    outputFormat: string;
}

export function generateFallbackPrompt(inputs: PromptInputs): string {
    // A structured template that mimics the "Optimized" output style
    return `
ROLE:
${inputs.role || "[Insert Role Here]"}

TASK:
${inputs.task || "[Insert Task Here]"}

CONTEXT & CONSTRAINTS:
${inputs.context || "No specific context provided."}

OUTPUT REQUIREMENTS:
- Tone: ${inputs.tone || "Professional"}
- Format: ${inputs.outputFormat || "Clear text"}

(Generated via Local Fallback Template)`;
}
