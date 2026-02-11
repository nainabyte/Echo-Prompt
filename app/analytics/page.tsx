"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Activity, Star, BarChart3, TrendingUp, PieChart as PieChartIcon, Zap } from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";

interface AnalyticsData {
    summary: {
        totalPrompts: number;
        avgScore: number;
        avgHumanRating: number;
    };
    popularModels: { name: string; count: number }[];
    recentActivity: { date: string; count: number }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
                        Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
                        A deep dive into your prompt engineering performance and AI model interactions.
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-zinc-400">Total Prompts</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white">{data.summary.totalPrompts}</div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                All-time generations
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-zinc-400">Avg. Score</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white">{data.summary.avgScore}%</div>
                            <div className="h-2 w-full bg-zinc-800 rounded-full mt-4 overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    style={{ width: `${data.summary.avgScore}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-semibold text-zinc-400">Human Rating</CardTitle>
                            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400/20" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white">{data.summary.avgHumanRating.toFixed(1)}/5.0</div>
                            <div className="flex gap-1.5 mt-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className={cn(
                                            "w-4 h-4 transition-all duration-300",
                                            s <= Math.round(data.summary.avgHumanRating)
                                                ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]"
                                                : "text-zinc-800"
                                        )}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Activity Chart */}
                    <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                                Activity Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="h-[350px] w-full pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.recentActivity}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#52525b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={12}
                                        />
                                        <YAxis
                                            stroke="#52525b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(9, 9, 11, 0.98)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '12px',
                                                backdropFilter: 'blur(12px)',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                            }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Models Distribution */}
                    <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <PieChartIcon className="w-5 h-5 text-purple-400" />
                                </div>
                                Model Ecosystem
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex flex-col md:flex-row items-center justify-around h-full py-6">
                                <div className="h-[300px] w-full md:w-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.popularModels}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="count"
                                                animationBegin={200}
                                                animationDuration={1500}
                                                label={{ fill: '#d1d1d6', fontSize: 10, fontWeight: 500 }}
                                            >
                                                {data.popularModels.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                                    />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(9, 9, 11, 0.98)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: '12px',
                                                    backdropFilter: 'blur(12px)',
                                                }}
                                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-4 w-full md:w-[220px] mt-8 md:mt-0">
                                    {data.popularModels.map((model, i) => (
                                        <div key={i} className="flex flex-col gap-1 group cursor-default">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                                                        style={{ backgroundColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
                                                    />
                                                    <span className="text-zinc-300 group-hover:text-white transition-colors">{model.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white">{model.count}</span>
                                            </div>
                                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full group-hover:opacity-100 opacity-60 transition-opacity"
                                                    style={{
                                                        backgroundColor: COLORS[i % COLORS.length],
                                                        width: `${(model.count / data.summary.totalPrompts) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
