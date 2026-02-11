import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PromptHistory from "@/models/PromptHistory";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const token = req.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const prompt = await PromptHistory.findById(params.id);

        if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

        return NextResponse.json({ prompt });
    } catch (error) {
        console.error("GET Prompt Detail Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const token = req.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        await dbConnect();

        const prompt = await PromptHistory.findById(params.id);
        if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });

        // Update basic fields
        if (body.title) prompt.title = body.title;
        if (body.attributes) Object.assign(prompt, body.attributes);
        if (body.isFavorite !== undefined) prompt.isFavorite = body.isFavorite;

        // Add new version
        if (body.newVersion) {
            prompt.versions.push({
                label: body.newVersion.label || `v${prompt.versions.length + 1}`,
                content: body.newVersion.content,
                timestamp: new Date(),
                comments: body.newVersion.comments
            });
            // Update current optimized prompt to match latest version
            prompt.optimizedPrompt = body.newVersion.content;
        }

        // Rollback (User passes a version content to restore)
        if (body.rollbackContent) {
            // Clean up old label to avoid "Restored from Restored from..."
            const sourceLabel = body.rollbackLabel.replace(/^Restored from /, "");
            prompt.versions.push({
                label: `Restored from ${sourceLabel}`,
                content: body.rollbackContent,
                timestamp: new Date(),
                comments: `Restored from version ${sourceLabel}`
            });
            prompt.optimizedPrompt = body.rollbackContent;
        }

        // Add responses
        if (body.newResponse) {
            prompt.responses.push(body.newResponse);
        }

        // Update specific response (e.g. toggle favorite)
        if (body.updateResponseId && body.responseUpdates) {
            const response = prompt.responses.id(body.updateResponseId);
            if (response) {
                if (body.responseUpdates.isFavorite !== undefined) {
                    response.isFavorite = body.responseUpdates.isFavorite;
                }
            }
        }

        await prompt.save();

        return NextResponse.json({ message: "Prompt updated", prompt });
    } catch (error) {
        console.error("UPDATE Prompt Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const token = req.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        await PromptHistory.findByIdAndDelete(params.id);

        return NextResponse.json({ message: "Prompt deleted" });
    } catch (error) {
        console.error("DELETE Prompt Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
