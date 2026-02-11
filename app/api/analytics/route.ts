import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import History from "@/models/History";
import PromptHistory from "@/models/PromptHistory";
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

        const historyPipeline = [
            { $match: { user: userId } },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalPrompts: { $sum: 1 },
                                avgScore: { $avg: "$evaluation.score" }
                            }
                        }
                    ],
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

        // Prompt Library (New) Pipeline
        const libraryPipeline = [
            { $match: { user: userId } },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalPrompts: { $sum: 1 },
                                avgScore: { $avg: { $avg: "$responses.evaluation.score" } },
                                avgRating: { $avg: { $avg: "$responses.rating" } }
                            }
                        }
                    ],
                    popularModels: [
                        { $unwind: "$responses" }, // Note: Library calls it 'responses'
                        { $match: { "responses.isFavorite": true } },
                        {
                            $group: {
                                _id: "$responses.model", // Note: Library calls it 'model'
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ],
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

        const [historyData, libraryData] = await Promise.all([
            History.aggregate(historyPipeline as any[]),
            PromptHistory.aggregate(libraryPipeline as any[])
        ]);

        // Merge Data
        const hStats = historyData[0]?.stats[0] || { totalPrompts: 0, avgScore: 0 };
        const lStats = libraryData[0]?.stats[0] || { totalPrompts: 0, avgScore: 0 };

        const totalPrompts = hStats.totalPrompts + lStats.totalPrompts;
        // Simple avg score logic (weighted average would be better but simple for now)
        const avgScore = hStats.totalPrompts > 0 ? hStats.avgScore : 0;

        // Merge Popular Models
        const modelMap = new Map();
        [...(historyData[0]?.popularModels || []), ...(libraryData[0]?.popularModels || [])].forEach((m: any) => {
            const current = modelMap.get(m._id) || 0;
            modelMap.set(m._id, current + m.count);
        });
        const popularModels = Array.from(modelMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Merge Recent Activity
        const activityMap = new Map();
        [...(historyData[0]?.recentActivity || []), ...(libraryData[0]?.recentActivity || [])].forEach((a: any) => {
            const current = activityMap.get(a._id) || 0;
            activityMap.set(a._id, current + a.count);
        });
        const recentActivity = Array.from(activityMap.entries())
            .map(([date, count]) => ({ _id: date, count })) // formatting to match expected output structure for map below
            .sort((a, b) => a._id.localeCompare(b._id));

        return NextResponse.json({
            summary: {
                totalPrompts,
                avgScore: Math.round(((hStats.avgScore * hStats.totalPrompts) + (lStats.avgScore * lStats.totalPrompts)) / (totalPrompts || 1)),
                avgHumanRating: Math.round((lStats.avgRating || 0) * 10) / 10
            },
            popularModels,
            recentActivity: recentActivity.map((a: any) => ({ date: a._id, count: a.count }))
        });

    } catch (error: any) {
        console.error("[Analytics] Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
