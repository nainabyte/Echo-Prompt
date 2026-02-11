/**
 * TypeScript interfaces for RAG documents
 */

export interface Document {
    id: string;
    userId: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadDate: Date;
    metadata?: Record<string, any>;
    chunkCount?: number;
}

export interface DocumentChunk {
    id: string;
    documentId: string;
    chunkIndex: number;
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
}

export interface SearchResult {
    id: string;
    content: string;
    chunkIndex: number;
    filename: string;
    documentId: string;
    similarity: number;
}

export interface UploadDocumentRequest {
    file: File;
}

export interface UploadDocumentResponse {
    success: boolean;
    documentId?: string;
    filename?: string;
    chunkCount?: number;
    error?: string;
}

export interface QueryDocumentsRequest {
    query: string;
    topK?: number;
    documentIds?: string[];
}

export interface QueryDocumentsResponse {
    success: boolean;
    results?: SearchResult[];
    error?: string;
}
