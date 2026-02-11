"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, GitBranch, RotateCcw, Clock, DollarSign, Copy, Check, Trash2, Info, Star } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

export default function PromptDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [prompt, setPrompt] = useState<any>(null);
    const [selectedVersion, setSelectedVersion] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchPrompt = async () => {
            const res = await fetch(`/api/prompts/${params.id}`);
            const data = await res.json();
            if (res.ok) {
                setPrompt(data.prompt);
                // Default to latest version
                if (data.prompt.versions.length > 0) {
                    setSelectedVersion(data.prompt.versions[data.prompt.versions.length - 1]);
                }
            }
        };
        fetchPrompt();
    }, [params.id]);

    const handleRollback = async (version: any) => {
        if (!confirm(`Are you sure you want to revert to "${version.label}"? This will create a new version copy.`)) return;

        const res = await fetch(`/api/prompts/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rollbackContent: version.content,
                rollbackLabel: version.label
            })
        });

        if (res.ok) {
            const data = await res.json();
            setPrompt(data.prompt);
            // Select the new latest version (which is the rollback)
            setSelectedVersion(data.prompt.versions[data.prompt.versions.length - 1]);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this prompt history? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/prompts/${params.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/prompts");
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleFavoriteResponse = async (responseId: string, currentStatus: boolean) => {
        const res = await fetch(`/api/prompts/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                updateResponseId: responseId,
                responseUpdates: { isFavorite: !currentStatus }
            })
        });

        if (res.ok) {
            const data = await res.json();
            setPrompt(data.prompt);
        }
    };

    if (!prompt) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Prompt
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats & Metadata */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">{prompt.title}</CardTitle>
                                <CardDescription>Created {format(new Date(prompt.createdAt), "PPP")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {prompt.tags.map((tag: string) => (
                                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <GitBranch className="w-4 h-4 text-blue-400" />
                                        <span>{prompt.versions.length} Versions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-green-400" />
                                        <span>{prompt.responses.length} Runs</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-card/50 rounded-xl p-4 border border-white/5">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-yellow-400" /> Estimated Cost
                            </h3>
                            <div className="text-2xl font-mono">
                                ${prompt.responses.reduce((acc: number, r: any) => acc + (r.cost || 0), 0).toFixed(6)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Cumulative cost of all runs</p>
                        </div>
                    </div>

                    {/* Right Column: Versions & Output */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="versions" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="versions">Version History</TabsTrigger>
                                <TabsTrigger value="results">Test Results</TabsTrigger>
                            </TabsList>

                            <TabsContent value="versions" className="space-y-4">
                                <div className="flex gap-4 h-[600px]">
                                    {/* Version List Sidebar */}
                                    <ScrollArea className="w-48 border-r border-white/10 pr-4">
                                        <div className="space-y-2">
                                            {prompt.versions.slice().reverse().map((v: any, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedVersion(v)}
                                                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedVersion === v
                                                        ? "bg-primary/20 border border-primary/50 text-primary"
                                                        : "hover:bg-muted"
                                                        }`}
                                                >
                                                    <div className="font-medium">{v.label}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {format(new Date(v.timestamp), "MMM d, HH:mm")}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    {/* Version Content */}
                                    <div className="flex-1 flex flex-col">
                                        {selectedVersion && (
                                            <>
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{selectedVersion.label}</h3>
                                                        <p className="text-sm text-muted-foreground">{selectedVersion.comments || "No comments"}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(selectedVersion.content)}>
                                                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                                            Copy
                                                        </Button>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="secondary" size="sm" onClick={() => handleRollback(selectedVersion)}>
                                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                                        Restore this Version
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Creates a new version copy of this content.</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 p-6 rounded-xl border border-white/10 font-mono text-sm whitespace-pre-wrap flex-1 overflow-auto">
                                                    {selectedVersion.content}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="results">
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-4">
                                        {prompt.responses.map((res: any, i: number) => (
                                            <Card key={i} className="bg-card/40">
                                                <CardHeader className="py-3">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-md font-medium flex items-center gap-2">
                                                            {res.model}
                                                            <Badge variant="outline" className="text-xs font-normal">
                                                                {res.duration}ms
                                                            </Badge>
                                                        </CardTitle>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs text-muted-foreground">
                                                                {format(new Date(res.timestamp), "MMM d, HH:mm")}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-6 w-6 p-0 hover:bg-transparent ${res.isFavorite ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
                                                                onClick={() => toggleFavoriteResponse(res._id, res.isFavorite)}
                                                            >
                                                                <Star className={`w-4 h-4 ${res.isFavorite ? "fill-yellow-400" : ""}`} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="py-3 text-sm text-muted-foreground">
                                                    {res.text.length > 200 ? res.text.substring(0, 200) + "..." : res.text}
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {prompt.responses.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground">
                                                No test results recorded for this prompt yet.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
