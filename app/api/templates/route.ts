import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Template from "@/models/Template";
import History from "@/models/History";
import { verifyToken } from "@/lib/auth";

async function getUser(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return null;
    return await verifyToken(token);
}

export async function POST(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, inputs, generatedPrompt, testInput, evaluation, results, historyId } = body;

        await dbConnect();

        console.log("Creating template with results count:", results?.length);

        const template = await Template.create({
            user: payload.userId,
            name,
            inputs,
            generatedPrompt,
            testInput,
            evaluation,
            results,
            historyId
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        console.error("[Templates POST] Error:", error);
        if (error.name === "MongooseServerSelectionError") {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, results } = body;

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await dbConnect();

        const template = await Template.findOne({ _id: id, user: payload.userId });
        if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

        if (results) {
            template.results = results;
        }

        await template.save();

        return NextResponse.json(template);
    } catch (error: any) {
        console.error("[Templates PATCH] Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
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
            const item = await Template.findOne({ _id: id, user: payload.userId });
            if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

            // Sync favorites from History if linked
            if (item.historyId) {
                try {
                    const historyItem = await History.findOne({ _id: item.historyId, user: payload.userId });
                    if (historyItem && historyItem.results) {
                        let hasUpdates = false;
                        const favMap = new Map();
                        // Map using prompt text as key since logic is deterministic
                        historyItem.results.forEach((r: any) => {
                            if (r.text) favMap.set(r.text, !!r.isFavorite);
                        });

                        // Update template results to match history
                        item.results.forEach((r: any) => {
                            const historyFav = favMap.get(r.text);
                            if (historyFav !== undefined && r.isFavorite !== historyFav) {
                                r.isFavorite = historyFav;
                                hasUpdates = true;
                            }
                        });

                        if (hasUpdates) {
                            await item.save();
                        }
                    }
                } catch (e) {
                    console.error("Failed to sync template with history", e);
                    // Continue returning item even if sync fails
                }
            }

            return NextResponse.json(item);
        }

        const templates = await Template.find({ user: payload.userId }).sort({ createdAt: -1 });

        return NextResponse.json({ data: templates || [] });
    } catch (error: any) {
        console.error("[Templates GET] Error:", error);
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
        const deleted = await Template.findOneAndDelete({ _id: id, user: payload.userId });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
