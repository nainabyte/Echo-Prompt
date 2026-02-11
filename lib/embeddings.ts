/**
 * Gemini Embeddings API wrapper
 * Updated: 2026-02-09
 */

// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate embeddings for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

        const result = await model.embedContent(text);
        const embedding = result.embedding;

        return embedding.values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Generate embeddings for multiple texts with robust rate limiting and retry logic
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const embeddings: number[][] = [];
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second base delay

    for (let i = 0; i < texts.length; i++) {
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
            try {
                const result = await model.embedContent(texts[i]);
                embeddings.push(result.embedding.values);
                success = true;

                // Add a small delay between successful requests to stay under rate limits (e.g., 20 RPM = 3s delay)
                if (i < texts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error: any) {
                if (error.status === 429) {
                    retryCount++;
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.warn(`Rate limited (429). Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('Error in generateEmbeddings:', error);
                    throw error;
                }
            }
        }

        if (!success) {
            throw new Error(`Failed to generate embedding for chunk ${i} after ${maxRetries} retries`);
        }
    }

    return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
