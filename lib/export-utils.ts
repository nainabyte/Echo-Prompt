
import { jsPDF } from "jspdf";

export interface ExportData {
    prompt: string;
    modelName?: string;
    response?: string;
    metadata?: {
        duration?: number;
        tokens?: number;
        cost?: number;
        score?: number;
    };
}

export const generateMarkdown = (data: ExportData): string => {
    let md = `# EchoPrompt Export\n\n`;
    md += `## Optimized Prompt\n\n\`\`\`text\n${data.prompt}\n\`\`\`\n\n`;

    if (data.response) {
        md += `## Model Response (${data.modelName || 'Selected Model'})\n\n`;
        md += `> ${data.response.split('\n').join('\n> ')}\n\n`;

        if (data.metadata) {
            md += `### Metadata\n`;
            if (data.metadata.duration) md += `- **Latency:** ${data.metadata.duration}ms\n`;
            if (data.metadata.tokens) md += `- **Estimated Tokens:** ${data.metadata.tokens}\n`;
            if (data.metadata.cost) md += `- **Estimated Cost:** $${data.metadata.cost.toFixed(4)}\n`;
            if (data.metadata.score) md += `- **Quality Score:** ${data.metadata.score}/100\n`;
        }
    }

    md += `\n---\n*Generated via EchoPrompt*`;
    return md;
};

export const downloadMarkdown = (data: ExportData, filename: string = "prompt-export.md") => {
    const content = generateMarkdown(data);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const downloadJSON = (data: ExportData, filename: string = "prompt-export.json") => {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const downloadPDF = (data: ExportData, filename: string = "prompt-export.pdf") => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxContentWidth = pageWidth - (margin * 2);
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("EchoPrompt Export", margin, y);
    y += 15;

    // Prompt Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Optimized Prompt:", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    const promptLines = doc.splitTextToSize(data.prompt, maxContentWidth);
    doc.text(promptLines, margin, y);
    y += (promptLines.length * 5) + 12;

    // Response Section
    if (data.response) {
        if (y > 250) { doc.addPage(); y = 20; }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Response (${data.modelName || 'Selected Model'}):`, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const responseLines = doc.splitTextToSize(data.response, maxContentWidth);
        doc.text(responseLines, margin, y);
        y += (responseLines.length * 5) + 12;

        // Metadata
        if (data.metadata) {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Metadata:", margin, y);
            y += 7;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            const meta = [];
            if (data.metadata.duration) meta.push(`Latency: ${data.metadata.duration}ms`);
            if (data.metadata.tokens) meta.push(`Tokens: ${data.metadata.tokens}`);
            if (data.metadata.cost) meta.push(`Cost: $${data.metadata.cost.toFixed(4)}`);
            if (data.metadata.score) meta.push(`Score: ${data.metadata.score}/100`);

            doc.text(meta.join(" | "), margin, y);
        }
    }

    doc.save(filename);
};
