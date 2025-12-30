import { ModelResult } from "@/components/prompt-builder/ModelResultCard";

export interface RecommendationCriteria {
    outputFormat?: string;
}

export interface Recommendation {
    bestIndex: number;
    reason: string;
}

export function recommendBestModel(results: ModelResult[], criteria: RecommendationCriteria): Recommendation | null {
    if (!results || results.length === 0) return null;

    let bestIndex = -1;
    let bestScore = -1;
    let bestReason = "";

    results.forEach((result, index) => {
        if (result.status === 'error' || !result.text) return;

        let score = 0;
        const reasons: string[] = [];

        // 1. Length/Completeness (Weighted heavily for now)
        // Normalize length up to 2000 chars (diminishing returns)
        const lengthScore = Math.min(result.text.length, 2000) / 20; // Max 100 points
        score += lengthScore;

        // 2. Format Compliance (Simple Keyword Check)
        if (criteria.outputFormat) {
            const fmt = criteria.outputFormat.toLowerCase();
            const text = result.text.toLowerCase();

            if (fmt.includes("json")) {
                if (text.includes("{") && text.includes("}")) {
                    score += 50;
                    reasons.push("Valid JSON structure");
                }
            } else if (fmt.includes("markdown") || fmt.includes("md")) {
                if (text.includes("#") || text.includes("**")) {
                    score += 30;
                    reasons.push("Good Markdown formatting");
                }
            } else if (fmt.includes("list")) {
                if (text.includes("- ") || text.includes("1. ")) {
                    score += 30;
                    reasons.push("Follows list format");
                }
            }
        }

        // 3. Speed Bonus (Slight preference for faster models if quality is similar)
        if (result.duration < 1000) score += 10;
        else if (result.duration < 3000) score += 5;

        // Determine if this is the new best
        if (score > bestScore) {
            bestScore = score;
            bestIndex = index;

            // Construct reason
            if (reasons.length > 0) {
                bestReason = reasons.join(", ");
            } else {
                bestReason = "Most comprehensive response";
            }
        }
    });

    if (bestIndex !== -1) {
        return { bestIndex, reason: bestReason };
    }

    return null;
}
