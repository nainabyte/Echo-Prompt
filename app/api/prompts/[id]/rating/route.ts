import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import PromptHistory from "@/models/PromptHistory";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = await verifyToken(token);
        if (!decoded) return NextResponse.json({ error: "Invalid Token" }, { status: 401 });

        const { modelName, rating } = await req.json();

        if (typeof rating !== 'number' || rating < 0 || rating > 5) {
            return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
        }

        await dbConnect();

        const history = await PromptHistory.findOne({ _id: params.id, user: decoded.userId });

        if (!history) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        // Find the response by model name
        const responseIndex = history.responses.findIndex((r: any) => r.model === modelName);

        if (responseIndex === -1) {
            return NextResponse.json({ error: "Response not found" }, { status: 404 });
        }

        history.responses[responseIndex].rating = rating;
        await history.save();

        return NextResponse.json({ message: "Rating updated", rating });
    } catch (error) {
        console.error("PATCH Rating Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
