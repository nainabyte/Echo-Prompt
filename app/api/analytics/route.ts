import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import History from "@/models/History";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

async function getUser(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return null;
    return await verifyToken(token);
}

export async function GET(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = new mongoose.Types.ObjectId(payload.userId as string);

        const pipeline = [
            { $match: { user: userId } },
            {
                $facet: {
                    // General Stats
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalPrompts: { $sum: 1 },
                                avgScore: { $avg: "$evaluation.score" }
                            }
                        }
                    ],
                    // Popular Models (based on favorites)
                    popularModels: [
                        { $unwind: "$results" },
                        { $match: { "results.isFavorite": true } },
                        {
                            $group: {
                                _id: "$results.name",
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ],
                    // Recent Activity (last 7 days volume)
                    recentActivity: [
                        { $match: { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ];

        const data = await History.aggregate(pipeline as any);

        const stats = data[0].stats[0] || { totalPrompts: 0, avgScore: 0 };
        const popularModels = data[0].popularModels;
        const recentActivity = data[0].recentActivity;

        return NextResponse.json({
            summary: {
                totalPrompts: stats.totalPrompts,
                avgScore: Math.round(stats.avgScore || 0)
            },
            popularModels: popularModels.map((m: any) => ({ name: m._id, count: m.count })),
            recentActivity: recentActivity.map((a: any) => ({ date: a._id, count: a.count }))
        });

    } catch (error: any) {
        console.error("[Analytics] Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
