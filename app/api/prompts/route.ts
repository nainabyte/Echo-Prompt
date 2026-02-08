import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PromptHistory from "@/models/PromptHistory";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        // Auth Check
        const token = req.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid Token" }, { status: 401 });

        await dbConnect();

        // Query Params
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const tag = searchParams.get("tag");

        const query: any = { user: decoded.userId };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { originalPrompt: { $regex: search, $options: "i" } }
            ];
        }

        if (tag) {
            query.tags = tag;
        }

        const prompts = await PromptHistory.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error("GET Prompts Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get("cookie")?.split("auth-token=")[1]?.split(";")[0];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid Token" }, { status: 401 });

        const body = await req.json();
        const { title, originalPrompt, optimizedPrompt, tags, responses } = body;

        await dbConnect();

        // Initial version represents the first save
        const initialVersion = {
            label: "v1 (Original)",
            content: originalPrompt,
            timestamp: new Date(),
            comments: "Initial creation"
        };

        const newPrompt = await PromptHistory.create({
            user: decoded.userId,
            title: title || "Untitled Prompt",
            originalPrompt,
            optimizedPrompt,
            versions: [initialVersion],
            responses: responses || [],
            tags: tags || []
        });

        return NextResponse.json({ message: "Prompt saved", prompt: newPrompt }, { status: 201 });
    } catch (error) {
        console.error("CREATE Prompt Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
