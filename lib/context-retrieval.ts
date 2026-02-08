/**
 * Context retrieval helper for RAG integration
 */

import type { SearchResult } from "@/models/Document";

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
    query: string,
    topK: number = 5,
    documentIds?: string[]
): Promise<SearchResult[]> {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Not authenticated");
        }

        const res = await fetch("/api/docs/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ query, topK, documentIds })
        });

        if (!res.ok) {
            throw new Error("Failed to retrieve context");
        }

        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error("Context retrieval error:", error);
        return [];
    }
}

/**
 * Format context results for prompt injection
 */
export function formatContextForPrompt(results: SearchResult[]): string {
    if (results.length === 0) {
        return "";
    }

    let formatted = "\n\n[Context Documents]\n";
    formatted += "The following documents may be relevant to your task:\n\n";

    results.forEach((result, index) => {
        formatted += `---\n`;
        formatted += `Document: ${result.filename} (Chunk ${result.chunkIndex + 1})\n`;
        formatted += `Relevance: ${(result.similarity * 100).toFixed(1)}%\n\n`;
        formatted += `${result.content}\n\n`;
    });

    formatted += "---\n\n[Your Task]\n";

    return formatted;
}

/**
 * Inject context into a prompt
 */
export function injectContext(prompt: string, context: SearchResult[]): string {
    if (context.length === 0) {
        return prompt;
    }

    const contextSection = formatContextForPrompt(context);
    return contextSection + prompt;
}
