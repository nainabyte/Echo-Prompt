
/**
 * Automated Evaluators for Model Responses
 */

export interface EvaluationResult {
    isValidJson: boolean;
    score: number;
    feedback: string[];
    keywordsFound: string[];
}

/**
 * Main evaluation function
 */
export async function evaluateResponse(
    text: string,
    requirements?: {
        keywords?: string[];
        mustBeJson?: boolean;
    }
): Promise<EvaluationResult> {
    const feedback: string[] = [];
    let score = 100;
    let isValidJson = true;
    const keywordsFound: string[] = [];

    // 1. Check JSON Validity if required
    if (requirements?.mustBeJson) {
        try {
            JSON.parse(text.trim());
            feedback.push("Valid JSON format detected.");
        } catch (e) {
            isValidJson = false;
            score -= 50;
            feedback.push("Failed to parse as JSON.");
        }
    } else {
        // Soft check for JSON even if not strictly required
        try {
            JSON.parse(text.trim());
            feedback.push("Note: Response is valid JSON.");
        } catch (e) {
            // No penalty if not required
        }
    }

    // 2. Check Keywords
    if (requirements?.keywords && requirements.keywords.length > 0) {
        const found = requirements.keywords.filter(kw =>
            text.toLowerCase().includes(kw.toLowerCase())
        );

        keywordsFound.push(...found);

        const missingCount = requirements.keywords.length - found.length;
        if (missingCount > 0) {
            const penalty = Math.min(40, (missingCount / requirements.keywords.length) * 40);
            score -= penalty;
            feedback.push(`Missing ${missingCount} required keywords.`);
        } else {
            feedback.push("All required keywords found.");
        }
    }

    // 3. Length/Empty Check
    if (!text || text.trim().length === 0) {
        score = 0;
        feedback.push("Empty response received.");
    } else if (text.length < 50) {
        score -= 10;
        feedback.push("Response seems unusually short.");
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, Math.round(score));

    return {
        isValidJson,
        score,
        feedback,
        keywordsFound
    };
}
