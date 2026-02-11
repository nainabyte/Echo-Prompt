"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Document, SearchResult } from "@/models/Document";

interface ContextManagerProps {
    selectedDocIds: string[];
    onSelectionChange: (ids: string[]) => void;
    className?: string;
}

export function ContextManager({ selectedDocIds, onSelectionChange, className = "" }: ContextManagerProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Fetch user's documents
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch("/api/docs", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to upload documents");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/docs/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert(`✅ Uploaded: ${data.filename} (${data.chunkCount} chunks)`);
                fetchDocuments();
            } else {
                alert(`❌ Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // Handle drag and drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // Handle document deletion
    const handleDelete = async (docId: string) => {
        if (!confirm("Delete this document? This cannot be undone.")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`/api/docs?id=${docId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setDocuments(docs => docs.filter(d => d.id !== docId));
                onSelectionChange(selectedDocIds.filter(id => id !== docId));
            } else {
                alert("Failed to delete document");
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    // Toggle document selection
    const toggleDocument = (docId: string) => {
        if (selectedDocIds.includes(docId)) {
            onSelectionChange(selectedDocIds.filter(id => id !== docId));
        } else {
            onSelectionChange([...selectedDocIds, docId]);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Card className={`border-white/10 ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Context Sources
                        </CardTitle>
                        <CardDescription>
                            Upload documents to enhance prompts with relevant context
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        {selectedDocIds.length} selected
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Zone */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? "border-primary bg-primary/5"
                        : "border-white/10 hover:border-white/20"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".txt,.md,.pdf,.docx"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                    Drop a file here or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Supports: TXT, MD, PDF, DOCX (max 10MB)
                                </p>
                            </>
                        )}
                    </label>
                </div>

                {/* Document List */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No documents uploaded yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedDocIds.includes(doc.id)
                                    ? "border-primary bg-primary/5"
                                    : "border-white/5 hover:border-white/10"
                                    }`}
                                onClick={() => toggleDocument(doc.id)}
                            >
                                <div className="flex-shrink-0">
                                    {selectedDocIds.includes(doc.id) ? (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(doc.fileSize)} • {doc.chunkCount || 0} chunks • {formatDate(doc.uploadDate)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(doc.id);
                                    }}
                                    className="flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
