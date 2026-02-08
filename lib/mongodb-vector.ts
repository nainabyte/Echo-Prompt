/**
 * MongoDB Vector Search utilities for RAG
 */

import RAGDocument from '@/models/RAGDocument';
import dbConnect from '@/lib/db';

/**
 * Store a document with its chunks and embeddings
 */
export async function storeDocument(
    userId: string,
    filename: string,
    fileType: string,
    fileSize: number,
    chunks: Array<{ content: string; embedding: number[] }>,
    metadata?: Record<string, any>
) {
    await dbConnect();

    const chunksWithIndex = chunks.map((chunk, index) => ({
        content: chunk.content,
        chunkIndex: index,
        embedding: chunk.embedding,
        metadata: {}
    }));

    const doc = await RAGDocument.findOneAndUpdate(
        { userId, filename },
        {
            userId,
            filename,
            fileType,
            fileSize,
            chunks: chunksWithIndex,
            metadata: metadata || {},
            uploadDate: new Date()
        },
        { upsert: true, new: true }
    );

    return doc._id.toString();
}

/**
 * Search for similar chunks using MongoDB Vector Search
 */
export async function searchSimilarChunks(
    userId: string,
    queryEmbedding: number[],
    topK: number = 5,
    documentIds?: string[]
) {
    await dbConnect();

    try {
        // Build the vector search pipeline
        const pipeline: any[] = [
            {
                $search: {
                    index: 'vector_index',
                    knnBeta: {
                        vector: queryEmbedding,
                        path: 'chunks.embedding',
                        k: topK * 3, // Get more results for filtering
                        filter: {
                            equals: {
                                path: 'userId',
                                value: userId
                            }
                        }
                    }
                }
            },
            { $unwind: '$chunks' },
            {
                $addFields: {
                    score: { $meta: 'searchScore' }
                }
            },
            { $sort: { score: -1 } },
            { $limit: topK },
            {
                $project: {
                    id: '$chunks._id',
                    content: '$chunks.content',
                    chunkIndex: '$chunks.chunkIndex',
                    filename: 1,
                    documentId: '$_id',
                    similarity: '$score'
                }
            }
        ];

        // If specific documents requested, add filter
        if (documentIds && documentIds.length > 0) {
            pipeline[0].$search.knnBeta.filter = {
                compound: {
                    must: [
                        {
                            equals: {
                                path: 'userId',
                                value: userId
                            }
                        },
                        {
                            in: {
                                path: '_id',
                                value: documentIds
                            }
                        }
                    ]
                }
            };
        }

        const results = await RAGDocument.aggregate(pipeline);
        return results;

    } catch (error: any) {
        // Fallback to simple search if vector index not available
        console.warn('Vector search failed, using fallback:', error.message);
        return fallbackSearch(userId, queryEmbedding, topK, documentIds);
    }
}

/**
 * Fallback search using in-memory cosine similarity
 * Used when vector index is not available (e.g., free tier limitations)
 */
async function fallbackSearch(
    userId: string,
    queryEmbedding: number[],
    topK: number,
    documentIds?: string[]
) {
    const query: any = { userId };
    if (documentIds && documentIds.length > 0) {
        query._id = { $in: documentIds };
    }

    const documents = await RAGDocument.find(query).lean();

    // Calculate cosine similarity for each chunk
    const scoredChunks: any[] = [];

    for (const doc of documents) {
        for (const chunk of doc.chunks || []) {
            const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
            scoredChunks.push({
                id: chunk._id,
                content: chunk.content,
                chunkIndex: chunk.chunkIndex,
                filename: doc.filename,
                documentId: doc._id,
                similarity
            });
        }
    }

    // Sort by similarity and return top K
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks.slice(0, topK);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string) {
    await dbConnect();

    const docs = await RAGDocument.find({ userId })
        .select('-chunks.embedding') // Exclude embeddings for performance
        .sort({ uploadDate: -1 })
        .lean();

    return docs.map((doc: any) => ({
        id: doc._id.toString(),
        filename: doc.filename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate,
        chunkCount: doc.chunks?.length || 0,
        metadata: doc.metadata
    }));
}

/**
 * Delete a document
 */
export async function deleteDocument(userId: string, documentId: string) {
    await dbConnect();

    const result = await RAGDocument.deleteOne({
        _id: documentId,
        userId
    });

    return result.deletedCount > 0;
}

/**
 * Initialize - No-op for MongoDB (no schema creation needed)
 */
export async function initializeDatabase() {
    await dbConnect();
    console.log('✅ MongoDB connection verified');
    console.log('⚠️  Remember to create vector_index in MongoDB Atlas UI');
    return true;
}
