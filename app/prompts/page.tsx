"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, History, Clock, Tag, ChevronRight, Star, Trash2 } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";

interface Prompt {
    _id: string;
    title: string;
    originalPrompt: string;
    versions: any[];
    responses: any[];
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
}

export default function PromptsPage() {
    const router = useRouter();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/prompts?search=${search}`);
            const data = await res.json();
            if (res.ok) {
                setPrompts(data.prompts);
            }
        } catch (error) {
            console.error("Failed to fetch prompts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchPrompts, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this prompt history?")) return;

        try {
            const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPrompts((prev) => prev.filter((p) => p._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto p-6 max-w-6xl">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Prompt Library
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your prompt versions, test results, and optimizations.
                        </p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search prompts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-card/50 border-white/10"
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 w-full rounded-xl" />
                        ))}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No prompt history found. Start building in the <Link href="/prompt-builder" className="text-primary underline">Prompt Builder</Link>.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prompts.map((prompt) => (
                            <Link href={`/prompts/${prompt._id}`} key={prompt._id}>
                                <Card className="group hover:border-primary/50 transition-all duration-300 h-full relative overflow-hidden bg-card/40 backdrop-blur-sm">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={(e) => handleDelete(prompt._id, e)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="line-clamp-1">{prompt.title}</CardTitle>
                                            {prompt.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        </div>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(prompt.createdAt), "MMM d, yyyy")}
                                            <span className="mx-1">•</span>
                                            {prompt.versions.length} versions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 font-mono bg-black/20 p-2 rounded">
                                            {prompt.originalPrompt}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="flex gap-2 flex-wrap">
                                        {prompt.responses.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {prompt.responses.length} Results
                                            </Badge>
                                        )}
                                        {prompt.tags.map(tag => (
                                            <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                                        ))}
                                        <div className="ml-auto">
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
