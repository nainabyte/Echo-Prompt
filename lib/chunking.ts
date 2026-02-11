/**
 * Text chunking utilities for RAG
 */

export interface TextChunk {
    content: string;
    index: number;
    metadata?: Record<string, any>;
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
    text: string,
    chunkSize: number = 500,
    overlap: number = 100
): TextChunk[] {
    const chunks: TextChunk[] = [];

    // Clean and normalize text
    const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();

    if (cleanText.length === 0) {
        return chunks;
    }

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanText.length) {
        // Calculate end index
        let endIndex = Math.min(startIndex + chunkSize, cleanText.length);

        // Try to break at sentence boundary if not at end
        if (endIndex < cleanText.length) {
            const sentenceEnd = findSentenceBoundary(cleanText, endIndex);
            if (sentenceEnd > startIndex) {
                endIndex = sentenceEnd;
            }
        }

        const content = cleanText.substring(startIndex, endIndex).trim();

        if (content.length > 0) {
            chunks.push({
                content,
                index: chunkIndex,
                metadata: {
                    startChar: startIndex,
                    endChar: endIndex,
                    length: content.length
                }
            });
            chunkIndex++;
        }

        // Move start index forward with overlap
        startIndex = endIndex - overlap;

        // Ensure we make progress
        if (startIndex <= chunks[chunks.length - 1]?.metadata?.startChar) {
            startIndex = endIndex;
        }
    }

    return chunks;
}

/**
 * Find the nearest sentence boundary
 */
function findSentenceBoundary(text: string, position: number): number {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];

    // Look backwards for sentence ender
    for (let i = position; i > Math.max(0, position - 100); i--) {
        for (const ender of sentenceEnders) {
            if (text.substring(i, i + ender.length) === ender) {
                return i + ender.length;
            }
        }
    }

    // Look forwards for sentence ender
    for (let i = position; i < Math.min(text.length, position + 100); i++) {
        for (const ender of sentenceEnders) {
            if (text.substring(i, i + ender.length) === ender) {
                return i + ender.length;
            }
        }
    }

    return position;
}

/**
 * Chunk text by paragraphs
 */
export function chunkByParagraphs(
    text: string,
    maxChunkSize: number = 1000
): TextChunk[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        if (currentChunk.length + trimmed.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                index: chunkIndex,
                metadata: { type: 'paragraph' }
            });
            chunkIndex++;
            currentChunk = trimmed;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
        }
    }

    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            index: chunkIndex,
            metadata: { type: 'paragraph' }
        });
    }

    return chunks;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
}

/**
 * Chunk text by token count
 */
export function chunkByTokens(
    text: string,
    maxTokens: number = 500,
    overlapTokens: number = 100
): TextChunk[] {
    const charPerToken = 4;
    const chunkSize = maxTokens * charPerToken;
    const overlap = overlapTokens * charPerToken;

    return chunkText(text, chunkSize, overlap);
}
