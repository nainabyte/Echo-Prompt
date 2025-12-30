"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Star, BarChart3, TrendingUp } from "lucide-react";

interface AnalyticsData {
    summary: {
        totalPrompts: number;
        avgScore: number;
    };
    popularModels: { name: string; count: number }[];
    recentActivity: { date: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("/api/analytics", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">Insights into your prompt engineering workflow.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prompts</CardTitle>
                            <Activity className="h-4 w-4 text-secondary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.totalPrompts}</div>
                            <p className="text-xs text-muted-foreground mt-1">Generated all time</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Optimization Score</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.avgScore}%</div>
                            <div className="h-2 w-full bg-secondary/20 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-green-500 transition-all" style={{ width: `${data.summary.avgScore}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Activity Chart (Simple List for MVP) */}
                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.recentActivity.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
                                ) : (
                                    data.recentActivity.map((day, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{day.date}</span>
                                                <span className="font-medium text-foreground">{day.count} prompts</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary/60 rounded-full"
                                                    style={{ width: `${Math.min((day.count / 10) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Models */}
                    <Card className="bg-zinc-900/50 border-white/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Favorite Models
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.popularModels.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">No favorites yet.</p>
                                ) : (
                                    data.popularModels.map((model, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                                                    {i + 1}
                                                </div>
                                                <span className="font-medium text-sm">{model.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                                                <Star className="w-3 h-3 fill-current" />
                                                {model.count}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}
