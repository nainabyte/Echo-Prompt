import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilarChunks } from '@/lib/mongodb-vector';

async function getUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    return await verifyToken(token);
}

/**
 * POST /api/docs/query - Search for similar document chunks
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await getUser(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query, topK = 5, documentIds } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'Query text required' }, { status: 400 });
        }

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);

        // Search for similar chunks
        const results = await searchSimilarChunks(
            payload.userId,
            queryEmbedding,
            topK,
            documentIds
        );

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('[Documents Query] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
