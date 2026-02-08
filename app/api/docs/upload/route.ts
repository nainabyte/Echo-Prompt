import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { parseDocument, isValidFileType, isValidFileSize, getFileExtension } from '@/lib/document-parser';
import { chunkByTokens } from '@/lib/chunking';
import { generateEmbeddings } from '@/lib/embeddings';
import { storeDocument } from '@/lib/mongodb-vector';

async function getUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    return await verifyToken(token);
}

export async function POST(req: NextRequest) {
    try {
        // Verify authentication
        const payload = await getUser(req);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse multipart form data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const fileExtension = getFileExtension(file.name);
        if (!isValidFileType(fileExtension) && !isValidFileType(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported: TXT, MD, PDF, DOCX' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        if (!isValidFileSize(file.size)) {
            return NextResponse.json(
                { error: 'File too large. Maximum size: 10MB' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from document
        let text: string;
        try {
            text = await parseDocument(buffer, fileExtension || file.type);
        } catch (error: any) {
            console.error('Document parsing error:', error);
            return NextResponse.json(
                { error: `Failed to parse document: ${error.message}` },
                { status: 400 }
            );
        }

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'Document appears to be empty' },
                { status: 400 }
            );
        }

        // Chunk the text
        const chunks = chunkByTokens(text, 500, 100);

        if (chunks.length === 0) {
            return NextResponse.json(
                { error: 'Failed to chunk document' },
                { status: 500 }
            );
        }

        // Generate embeddings for all chunks
        const chunkTexts = chunks.map(c => c.content);
        let embeddings: number[][];

        try {
            embeddings = await generateEmbeddings(chunkTexts);
        } catch (error: any) {
            console.error('Embedding generation error:', error);
            return NextResponse.json(
                { error: 'Failed to generate embeddings' },
                { status: 500 }
            );
        }

        // Combine chunks with embeddings
        const chunksWithEmbeddings = chunks.map((chunk, i) => ({
            content: chunk.content,
            embedding: embeddings[i]
        }));

        // Store in database
        const documentId = await storeDocument(
            payload.userId as string,
            file.name,
            file.type || fileExtension,
            file.size,
            chunksWithEmbeddings,
            {
                originalSize: text.length,
                chunkCount: chunks.length
            }
        );

        return NextResponse.json({
            success: true,
            documentId,
            filename: file.name,
            chunkCount: chunks.length
        }, { status: 201 });

    } catch (error: any) {
        /**
         * Document Upload API Route
         * Updated: 2026-02-09
         */
        console.error('[Document Upload] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
