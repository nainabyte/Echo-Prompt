"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, FileDown, FileText, Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this prompt from history?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/history?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setHistory((prev) => prev.filter((item) => item._id !== id));
            } else {
                alert("Failed to delete item.");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const getFilename = (item: any, ext: string) => {
        const base = item.name ? item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `echoprompt_${item._id}`;
        return `${base}.${ext}`;
    };

    const handleExportWord = (item: any) => {
        const hasResults = item.results && item.results.length > 0;

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${item.name || "EchoPrompt Record"}</title>
                <style>
                    body { font-family: Calibri, sans-serif; line-height: 1.5; color: #000; }
                    h1 { color: #2E75B6; font-size: 24px; border-bottom: 2px solid #2E75B6; padding-bottom: 5px; }
                    h2 { color: #2E75B6; font-size: 18px; margin-top: 20px; }
                    h3 { color: #1f4e79; font-size: 14px; margin-top: 15px; background-color: #f0f0f0; padding: 5px; }
                    p { margin-bottom: 10px; }
                    .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
                    .label { font-weight: bold; color: #444; }
                    .prompt-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; font-family: Consolas, monospace; font-size: 11px; }
                    .response-box { margin-bottom: 20px; }
                    .favorite { color: #d4a017; font-weight: bold; }
                    hr { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>EchoPrompt Record</h1>
                <div class="meta">
                    <strong>Values:</strong> ${item.name || "Untitled"}<br>
                    <strong>Date:</strong> ${new Date(item.createdAt).toLocaleString()}
                </div>

                <h2>1. Definition</h2>
                <p><span class="label">Task:</span> ${item.inputs.task}</p>
                <p><span class="label">Role:</span> ${item.inputs.role || "N/A"}</p>
                <p><span class="label">Tone:</span> ${item.inputs.tone || "N/A"}</p>
                ${item.inputs.context ? `<p><span class="label">Context:</span><br>${item.inputs.context.replace(/\n/g, '<br>')}</p>` : ''}

                <h2>2. Optimized Prompt</h2>
                <div class="prompt-box">
                    ${item.generatedPrompt.replace(/\n/g, '<br>')}
                </div>

                ${hasResults ? `
                    <h2>3. Model Responses</h2>
                    ${item.results.map((res: any) => `
                        <div class="response-box">
                            <h3>
                                Model: ${res.name} 
                                ${res.isFavorite ? '<span class="favorite">★ FAVORITE</span>' : ''}
                            </h3>
                            <div class="meta">
                                Duration: ${res.duration}ms | Status: ${res.status}
                            </div>
                            <p>${(res.text || res.error || "").replace(/\n/g, '<br>')}</p>
                            <hr>
                        </div>
                    `).join('')}
                ` : ''}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getFilename(item, 'doc');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = (item: any) => {
        const doc = new jsPDF();
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        const maxContentHeight = pageHeight - margin;

        const checkPageBreak = (heightToAdd: number) => {
            if (y + heightToAdd > maxContentHeight) {
                doc.addPage();
                y = 20; // Reset y to top margin
            }
        };

        const addText = (text: string, size: number, color = [0, 0, 0], isBold = false) => {
            doc.setFontSize(size);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFont("helvetica", isBold ? "bold" : "normal");

            if (!text) return;

            // Split into lines that fit width
            const lines = doc.splitTextToSize(text, 190);
            const lineHeight = size * 0.4; // Conversion approx for spacing

            lines.forEach((line: string) => {
                checkPageBreak(lineHeight);
                doc.text(line, margin, y);
                y += lineHeight;
            });

            y += lineHeight * 0.5; // Small gap after block
        };

        const addSectionHeader = (title: string) => {
            checkPageBreak(15);
            y += 5;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, 190, 8, 'F');
            addText(title, 12, [0, 80, 150], true);
            y += 2;
        };

        // Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("EchoPrompt Record", margin, y);
        y += 15;

        if (item.name) addText(`Name: ${item.name}`, 14, [0, 0, 0], true);
        addText(`Date: ${new Date(item.createdAt).toLocaleString()}`, 10, [100, 100, 100]);
        y += 5;

        // 1. Inputs
        addSectionHeader("1. Inputs");
        addText(`Role: ${item.inputs.role || "N/A"}`, 10);
        addText(`Task: ${item.inputs.task}`, 10);
        if (item.inputs.context) addText(`Context: \n${item.inputs.context}`, 10);
        if (item.inputs.tone) addText(`Tone: ${item.inputs.tone}`, 10);

        // 2. Generated Prompt
        addSectionHeader("2. Optimized Prompt");
        addText(item.generatedPrompt, 10);

        // 3. Results
        if (item.results && item.results.length > 0) {
            addSectionHeader("3. Model Responses");

            item.results.forEach((res: any, idx: number) => {
                checkPageBreak(20);
                y += 5;

                // Model Sub-header
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                const title = `Model: ${res.name} ${res.isFavorite ? "★ FAVORITE" : ""}`;
                doc.text(title, margin, y);
                y += 6;

                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.setFont("helvetica", "normal");
                doc.text(`Duration: ${res.duration}ms | Status: ${res.status}`, margin, y);
                y += 8;

                // Response Body - ensure clean spacing
                addText(res.text || res.error || "No content received", 10);

                // Separator line
                doc.setDrawColor(220);
                doc.line(margin, y - 2, 200, y - 2);
                y += 5;
            });
        }

        doc.save(getFilename(item, 'pdf'));
    };

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await fetch("/api/history", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-gradient">History</h1>
            </div>

            {history.length === 0 ? (
                <p className="text-muted-foreground">No history yet. Start generating prompts!</p>
            ) : (
                <div className="grid gap-6">
                    {history.map((item) => (
                        <Card key={item._id} className="relative group hover:border-blue-500/50 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg mb-1">{item.name || item.inputs?.task?.substring(0, 80) + "..."}</CardTitle>
                                        <CardDescription>
                                            {new Date(item.createdAt).toLocaleString()} | Score: {item.evaluation?.score}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" title="Export Word" onClick={() => handleExportWord(item)}>
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" title="Export PDF" onClick={() => handleExportPDF(item)}>
                                            <FileDown className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" title="Delete" onClick={() => handleDelete(item._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">GENERATED PROMPT</p>
                                        <pre className="bg-zinc-950 p-4 rounded-md text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto border border-zinc-800">
                                            {item.generatedPrompt}
                                        </pre>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link
                                    href={`/prompt-builder?loadId=${item._id}&source=history`}
                                    className="w-full"
                                >
                                    <Button variant="secondary" className="w-full">Open Optimized Prompt</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
