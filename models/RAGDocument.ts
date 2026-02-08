import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

interface IDocumentChunk {
    content: string;
    chunkIndex: number;
    embedding: number[];
    metadata?: Map<string, any>;
}

interface IRAGDocument extends MongooseDocument {
    userId: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadDate: Date;
    chunks: IDocumentChunk[];
    metadata?: Map<string, any>;
}

const DocumentChunkSchema = new Schema({
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    embedding: { type: [Number], required: true },
    metadata: { type: Map, of: Schema.Types.Mixed }
});

const RAGDocumentSchema = new Schema({
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    uploadDate: { type: Date, default: Date.now },
    chunks: [DocumentChunkSchema],
    metadata: { type: Map, of: Schema.Types.Mixed }
});

// Compound index for user + filename uniqueness
RAGDocumentSchema.index({ userId: 1, filename: 1 }, { unique: true });

export default mongoose.models.RAGDocument || mongoose.model<IRAGDocument>('RAGDocument', RAGDocumentSchema);
