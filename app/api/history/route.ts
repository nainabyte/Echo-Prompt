import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import History from "@/models/History";
import Template from "@/models/Template";
import { verifyToken } from "@/lib/auth";

// Helper to get user from request
async function getUser(req: Request) {
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.split(" ")[1];
    if (!token) {
        // Fallback to cookie
        const cookies = req.headers.get("cookie");
        // simple parsing or assume missing if no header in this context
        // for simplicity relying on Authorization header for API calls from client
    }
    if (!token) return null;
    return await verifyToken(token);
}

export async function POST(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        await dbConnect();

        const history = await History.create({
            user: payload.userId,
            ...body,
            versions: body.generatedPrompt ? [{
                label: "Version 1: AI Generated",
                content: body.generatedPrompt,
                score: body.evaluation?.score || 0,
                timestamp: new Date()
            }] : []
        });

        return NextResponse.json(history, { status: 201 });
    } catch (error: any) {
        console.error("[History POST] Error:", error);
        if (error.name === "MongooseServerSelectionError") {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const item = await History.findOne({ _id: id, user: payload.userId });
            if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
            return NextResponse.json(item);
        }

        const history = await History.find({ user: payload.userId }).sort({ createdAt: -1 });

        return NextResponse.json({ data: history || [] });
    } catch (error: any) {
        console.error("[History GET] Error:", error);
        if (error.name === "MongooseServerSelectionError") {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await dbConnect();
        const deleted = await History.findOneAndDelete({ _id: id, user: payload.userId });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        // Cascade delete: Remove any templates linked to this history item
        try {
            await Template.deleteMany({ historyId: id, user: payload.userId });
        } catch (e) {
            console.error("Failed to cascade delete templates", e);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
export async function PATCH(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await dbConnect();
        const existing = await History.findOne({ _id: id, user: payload.userId });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (updates.generatedPrompt && updates.generatedPrompt !== existing.generatedPrompt) {
            const newVersion = {
                label: `Version ${existing.versions.length + 1}`,
                content: updates.generatedPrompt,
                score: updates.evaluation?.score || 0,
                timestamp: new Date()
            };
            updates.$push = { versions: newVersion };
        }

        const updated = await History.findOneAndUpdate(
            { _id: id, user: payload.userId },
            { $set: updates, ...(updates.$push && { $push: updates.$push }) },
            { new: true }
        );

        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
