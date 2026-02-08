/**
 * Document parsing utilities for various file types
 */

/**
 * Extract text from plain text file
 */
export async function parseTextFile(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
}

/**
 * Extract text from markdown file
 */
export async function parseMarkdownFile(buffer: Buffer): Promise<string> {
    // For now, treat as plain text
    // In future, could strip markdown syntax or preserve structure
    return buffer.toString('utf-8');
}

/**
 * Extract text from PDF (requires pdf-parse)
 */
export async function parsePDFFile(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import to avoid bundling if not needed
        // @ts-ignore
        const { PDFParse } = await import('pdf-parse');
        // @ts-ignore
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const path = await import('path');

        // Use local file path instead of CDN to avoid ESM loader protocol restrictions (https:) in Node.js
        const workerPath = path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

        // The Mehmet Kozan version (2.x) is a class and needs 'new'
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text;
    } catch (error: any) {
        console.error('PDF parsing error Details:', error.message);
        throw new Error(`Failed to parse PDF file: ${error.message}`);
    }
}

/**
 * Extract text from DOCX (requires mammoth)
 */
export async function parseDOCXFile(buffer: Buffer): Promise<string> {
    try {
        // Dynamic import
        // @ts-ignore
        const mammothModule = await import('mammoth');
        const mammoth = (mammothModule as any).default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to parse DOCX file. Make sure mammoth is installed.');
    }
}

/**
 * Parse document based on file type
 */
export async function parseDocument(
    buffer: Buffer,
    fileType: string
): Promise<string> {
    const type = fileType.toLowerCase();

    if (type === 'text/plain' || type === 'txt') {
        return parseTextFile(buffer);
    } else if (type === 'text/markdown' || type === 'md') {
        return parseMarkdownFile(buffer);
    } else if (type === 'application/pdf' || type === 'pdf') {
        return parsePDFFile(buffer);
    } else if (
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        type === 'docx'
    ) {
        return parseDOCXFile(buffer);
    } else {
        throw new Error(`Unsupported file type: ${fileType}`);
    }
}

/**
 * Validate file type
 */
export function isValidFileType(fileType: string): boolean {
    const validTypes = [
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt',
        'md',
        'pdf',
        'docx'
    ];

    return validTypes.includes(fileType.toLowerCase());
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return size > 0 && size <= maxSize;
}
