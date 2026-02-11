export interface PromptInputs {
    role?: string;
    task: string;
    context?: string;
    tone?: string;
    outputFormat?: string;
}

export interface RuleTrace {
    name: string;
    description: string;
    status: "pass" | "fail" | "info";
    scoreImpact: number;
}

export interface EvaluationResult {
    score: number;
    breakdown: {
        role: number;
        task: number;
        context: number;
        output: number;
        tone: number;
    };
    issues: string[];
    suggestions: {
        text: string;
        rule: string;
        reason: string;
    }[];
    ruleLog: RuleTrace[];
}

export function evaluatePrompt(inputs: PromptInputs): EvaluationResult {
    const issues: string[] = [];
    const suggestions: { text: string; rule: string; reason: string; }[] = [];
    const ruleLog: RuleTrace[] = [];

    let roleScore = 0;
    let taskScore = 0;
    let contextScore = 0;
    let outputScore = 0;
    let toneScore = 0;

    // 1. Task Clarity (Max 30)
    if (!inputs.task || inputs.task.trim().length === 0) {
        issues.push("Task is missing.");
        suggestions.push({
            text: "Define a clear task for the AI.",
            rule: "Task Existence",
            reason: "The AI needs a specific objective to provide relevant results."
        });
        ruleLog.push({ name: "Task Existence", description: "Check if task is defined", status: "fail", scoreImpact: 0 });
    } else {
        ruleLog.push({ name: "Task Existence", description: "Check if task is defined", status: "pass", scoreImpact: 0 });

        const taskWords = inputs.task.trim().split(/\s+/).length;
        if (taskWords < 5) {
            taskScore = 15;
            issues.push("Task is too short.");
            suggestions.push({
                text: "Expand the task description with more verbs and details.",
                rule: "Task Length",
                reason: "Longer task descriptions help the AI understand constraints and nuances."
            });
            ruleLog.push({ name: "Task Length", description: "Check if task > 5 words", status: "fail", scoreImpact: 15 });
        } else {
            taskScore = 30;
            ruleLog.push({ name: "Task Length", description: "Check if task > 5 words", status: "pass", scoreImpact: 30 });
        }

        const weakVerbs = ['do', 'write', 'make', 'create'];
        const hasWeakVerb = weakVerbs.some(v => inputs.task.toLowerCase().includes(v));
        if (hasWeakVerb) {
            issues.push("Task uses generic verbs.");
            suggestions.push({
                text: "Use strong action verbs like 'Analyze', 'Synthesize', 'Draft', 'Codify'.",
                rule: "Verb Strength",
                reason: "Specific verbs trigger more sophisticated AI responses."
            });
            taskScore = Math.max(0, taskScore - 5);
            ruleLog.push({ name: "Verb Strength", description: "Check for weak verbs (do, make, etc.)", status: "fail", scoreImpact: -5 });
        } else {
            ruleLog.push({ name: "Verb Strength", description: "Check for weak verbs", status: "pass", scoreImpact: 0 });
        }
    }

    // 2. Role Specificity (Max 20)
    if (inputs.role && inputs.role.trim().length > 3) {
        roleScore = 20;
        ruleLog.push({ name: "Role Definition", description: "Check if role is defined and specific", status: "pass", scoreImpact: 20 });
    } else {
        issues.push("Role is undefined or too vague.");
        suggestions.push({
            text: "Assign a specific persona (e.g., 'Senior React Developer', 'Legal Consultant').",
            rule: "Role Definition",
            reason: "Personas help the AI adopt the correct domain-specific knowledge and tone."
        });
        ruleLog.push({ name: "Role Definition", description: "Check if role is defined and specific", status: "fail", scoreImpact: 0 });
    }

    // 3. Context Completeness (Max 20)
    if (inputs.context && inputs.context.trim().length > 10) {
        contextScore = 20;
        ruleLog.push({ name: "Context Depth", description: "Check if context > 10 chars", status: "pass", scoreImpact: 20 });
    } else {
        issues.push("Context is missing or minimal.");
        suggestions.push({
            text: "Provide background information, constraints, or datasets.",
            rule: "Context Depth",
            reason: "Context limits hallucinations and provides a grounding for the AI's reasoning."
        });
        ruleLog.push({ name: "Context Depth", description: "Check if context > 10 chars", status: "fail", scoreImpact: 0 });
    }

    // 4. Output Format (Max 20)
    if (inputs.outputFormat && inputs.outputFormat.trim().length > 0) {
        outputScore = 20;
        ruleLog.push({ name: "Format Specification", description: "Check if output format is defined", status: "pass", scoreImpact: 20 });
    } else {
        issues.push("Output format is unspecified.");
        suggestions.push({
            text: "Specify how you want the response (e.g., 'JSON', 'Markdown table', 'Bullet points').",
            rule: "Format Specification",
            reason: "Clear output formats make responses easier to parse and use in varied applications."
        });
        ruleLog.push({ name: "Format Specification", description: "Check if output format is defined", status: "fail", scoreImpact: 0 });
    }

    // 5. Tone (Max 10)
    if (inputs.tone && inputs.tone.trim().length > 0) {
        toneScore = 10;
        ruleLog.push({ name: "Tone Setting", description: "Check if tone is defined", status: "pass", scoreImpact: 10 });
    } else {
        issues.push("Tone is not set.");
        suggestions.push({
            text: "Set a tone (e.g., 'Professional', 'Wit', 'Academic').",
            rule: "Tone Setting",
            reason: "Tone settings ensure the response aligns with you desired brand or communication style."
        });
        ruleLog.push({ name: "Tone Setting", description: "Check if tone is defined", status: "fail", scoreImpact: 0 });
    }

    const totalScore = roleScore + taskScore + contextScore + outputScore + toneScore;

    return {
        score: totalScore,
        breakdown: {
            role: roleScore,
            task: taskScore,
            context: contextScore,
            output: outputScore,
            tone: toneScore
        },
        issues,
        suggestions,
        ruleLog
    };
}
