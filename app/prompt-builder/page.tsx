"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { evaluatePrompt, type EvaluationResult } from "@/lib/evaluation-model";
import { recommendBestModel, type Recommendation } from "@/lib/recommendation-engine";
import { Copy, Star, Check, AlertCircle, Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModelResultsGrid } from "@/components/prompt-builder/ModelResultsGrid";
import { ExplainabilityPanel } from "@/components/prompt-builder/ExplainabilityPanel";
import { PromptDiff } from "@/components/prompt-builder/PromptDiff";
import { ContextManager } from "@/components/prompt-builder/ContextManager";
import { Maximize2, Lightbulb, GraduationCap, GitCompare, Download, FileText, FileJson, FileType } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getExplanation, getRandomTip } from "@/lib/learning-content";
import { downloadMarkdown, downloadPDF, downloadJSON, type ExportData } from "@/lib/export-utils";

interface ModelResult {
    name: string;
    status: "success" | "error";
    text?: string;
    error?: string;
    duration: number;
    isFavorite?: boolean;
    isPinned?: boolean;
    cost?: number;
    rating?: number;
    evaluation?: {
        isValidJson: boolean;
        score: number;
        feedback: string[];
        keywordsFound: string[];
    };
}

function Sparkline({ data }: { data: number[] }) {
    if (data.length === 0) return null;
    const min = 0;
    const max = 100;
    const width = 120;
    const height = 30;
    const padding = 2;

    if (data.length === 1) {
        return (
            <svg width={width} height={height} className="overflow-visible">
                <circle
                    cx={width / 2}
                    cy={height - ((data[0] - min) / (max - min)) * (height - 2 * padding) - padding}
                    r="2"
                    className="fill-primary"
                />
            </svg>
        );
    }

    // Normalize data to fit the sparkline
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((val - min) / (max - min)) * (height - 2 * padding) - padding;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="text-primary transition-all duration-500"
            />
            {data.map((val, i) => (
                <circle
                    key={i}
                    cx={(i / (data.length - 1)) * (width - 2 * padding) + padding}
                    cy={height - ((val - min) / (max - min)) * (height - 2 * padding) - padding}
                    r="2"
                    className="fill-primary"
                />
            ))}
        </svg>
    );
}

function PromptQualityMeter({ score, historicalScores, ruleLog }: { score: number, historicalScores: number[], ruleLog?: any[] }) {
    const getMeterColor = (s: number) => {
        if (s < 40) return "from-red-500 to-red-400";
        if (s < 70) return "from-yellow-500 to-yellow-400";
        return "from-emerald-500 to-emerald-400";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-black transition-all duration-500",
                        score < 40 ? "border-red-500/20 text-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]" :
                            score < 70 ? "border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]" :
                                "border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                    )}>
                        {score}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Quality Score</div>
                            {ruleLog && ruleLog.length > 0 && (
                                <ExplainabilityPanel ruleLog={ruleLog} score={score} />
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {score < 40 ? "Needs significant improvement" :
                                score < 70 ? "Good, but can be better" :
                                    "High quality prompt"}
                        </div>
                    </div>
                </div>
                {historicalScores.length > 1 && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">Historical Trend</span>
                        <Sparkline data={historicalScores} />
                    </div>
                )}
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-700 ease-out bg-gradient-to-r", getMeterColor(score))}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

const SUGGESTIONS = {
    role: ["Senior Developer", "Creative Writer", "Data Scientist", "System Architect"],
    task: ["Refactor for performance", "Summarize this text", "Write unit tests", "Explain this concept"],
    context: ["Output for developers", "Business presentation", "Technical documentation", "Beginner friendly"],
    tone: ["Professional", "Humorous", "Academic", "Concise"]
};

const STYLE_PRESETS = [
    {
        id: "strict",
        name: "Strict",
        icon: "🛡️",
        config: { temperature: 0.1, tone: "Professional", outputFormat: "Markdown" },
        example: "Clear, factual, and professional. Minimal fluff."
    },
    {
        id: "creative",
        name: "Creative",
        icon: "🎨",
        config: { temperature: 0.9, tone: "Expressive", outputFormat: "Poetic" },
        example: "Inspired, imaginative, and engaging. High variety."
    },
    {
        id: "research",
        name: "Research",
        icon: "🔬",
        config: { temperature: 0.5, tone: "Academic", outputFormat: "Detailed Analysis" },
        example: "Structured, thorough, and analytical. Evidence-based."
    }
];

function StylePresetSelector({ onSelect }: { onSelect: (config: any, styleName: string) => void }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {STYLE_PRESETS.map((preset) => (
                <Card
                    key={preset.id}
                    className="cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden bg-zinc-900/50"
                    onClick={() => onSelect(preset.config, preset.name)}
                >
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{preset.icon}</span>
                            <span className="font-bold text-sm tracking-tight">{preset.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight italic line-clamp-2">
                            "{preset.example}"
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function SuggestionChip({ label, onClick }: { label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-[10px] px-2 py-1 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap"
        >
            + {label}
        </button>
    );
}

function PromptBuilderContent() {
    const searchParams = useSearchParams();

    const [inputs, setInputs] = useState({
        role: searchParams.get("role") || "",
        task: searchParams.get("task") || "",
        context: searchParams.get("context") || "",
        tone: searchParams.get("tone") || "",
        outputFormat: searchParams.get("format") || "",
        temperature: 0.7,
        maxTokens: 2048
    });
    const [previousInputs, setPreviousInputs] = useState<typeof inputs | null>(null);

    const [advancedMode, setAdvancedMode] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isLearningMode, setIsLearningMode] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [enableRAG, setEnableRAG] = useState(false);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [dailyTip, setDailyTip] = useState("");
    const [style, setStyle] = useState("Strict");
    const [evaluation, setEvaluation] = useState<EvaluationResult>({
        score: 0,
        breakdown: { role: 0, task: 0, context: 0, output: 0, tone: 0 },
        issues: [],
        suggestions: [],
        ruleLog: []
    });

    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [testInput, setTestInput] = useState("");
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [results, setResults] = useState<ModelResult[]>([]);
    const [isGeneratingResponses, setIsGeneratingResponses] = useState(false);
    const [versions, setVersions] = useState<{ label: string; content: string; score?: number; timestamp: Date }[]>([]);

    // Tracking state
    // Tracking state
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isFallbackMode, setIsFallbackMode] = useState(false);
    const [usage, setUsage] = useState<{ current: number, limit: number } | null>(null);
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

    useEffect(() => {
        const result = evaluatePrompt(inputs);
        setEvaluation(result);
    }, [inputs]);

    useEffect(() => {
        setDailyTip(getRandomTip());
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        if (generatedPrompt && !isGeneratingResponses) {
                            handleGenerateResponses();
                        }
                    } else {
                        e.preventDefault();
                        if (evaluation.score >= 20 && !isGeneratingPrompt) {
                            handleGeneratePrompt();
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputs, evaluation, generatedPrompt, isGeneratingPrompt, isGeneratingResponses, testInput]);

    // Load data from History or Template if ID provided
    useEffect(() => {
        const loadId = searchParams.get("loadId");
        const source = searchParams.get("source"); // 'history' or 'templates'

        if (loadId && source) {
            const fetchData = async () => {
                const token = localStorage.getItem("token");
                if (!token) return;

                try {
                    const res = await fetch(`/api/${source}?id=${loadId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setInputs({
                            role: data.inputs.role || "",
                            task: data.inputs.task || "",
                            context: data.inputs.context || "",
                            tone: data.inputs.tone || "",
                            outputFormat: data.inputs.outputFormat || "",
                            temperature: data.inputs.temperature || 0.7,
                            maxTokens: data.inputs.maxTokens || 2048
                        });

                        if (data.generatedPrompt) {
                            setGeneratedPrompt(data.generatedPrompt);
                        }

                        if (data.versions) {
                            setVersions(data.versions);
                        }

                        // Load results if present
                        if (data.results && data.results.length > 0) {
                            setResults(data.results);
                        }

                        // Set results and ID if loading history to enable favoriting updates
                        if (source === 'history') {
                            setCurrentHistoryId(loadId);
                            setCurrentTemplateId(null);
                        } else if (source === 'templates') {
                            setCurrentTemplateId(loadId);
                            setCurrentHistoryId(null);
                        }

                        if (data.evaluation) {
                            setEvaluation(data.evaluation);
                        }

                        if (data.testInput) {
                            setTestInput(data.testInput);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load data");
                }
            };
            fetchData();
        }
    }, [searchParams]);

    const handleApplyPreset = (config: any, styleName: string) => {
        setInputs(prev => ({ ...prev, ...config }));
        setStyle(styleName);
    };

    const handleChange = (field: string, value: string | number) => {
        setInputs((prev) => ({ ...prev, [field]: value }));
    };

    const handleApplySuggestions = () => {
        setPreviousInputs(inputs);
        setInputs(prev => {
            let newTask = prev.task;
            // Rule: If task is short but not empty, enhance it
            if (newTask.length > 0 && newTask.length < 20) {
                newTask = `${newTask} Ensure the response is detailed, accurate, and covers all key aspects.`;
            }

            return {
                ...prev,
                role: prev.role || "Helpful AI Assistant",
                tone: prev.tone || "Professional and Clear",
                outputFormat: prev.outputFormat || "Markdown",
                task: newTask
            };
        });
    };

    const handleUndoSuggestions = () => {
        if (previousInputs) {
            setInputs(previousInputs);
            setPreviousInputs(null);
        }
    };

    const handleGeneratePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            const res = await fetch("/api/generate/prompt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                },
                body: JSON.stringify({
                    inputs,
                    evaluation,
                    style,
                    enableRAG,
                    selectedDocIds
                }),
            });
            const data = await res.json();

            if (res.status === 429) {
                alert("Daily Quota Exceeded! Please try again tomorrow.");
                if (data.usage) setUsage(data.usage);
                return;
            }

            if (data.prompt) {
                setGeneratedPrompt(data.prompt);
                setIsFallbackMode(!!data.isFallback);
                if (data.usage) setUsage(data.usage);
            } else if (data.error) {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Failed to generate prompt");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleFavorite = async (index: number) => {
        const newResults = [...results];
        newResults[index].isFavorite = !newResults[index].isFavorite;
        setResults(newResults);

        // Update history if it exists
        if (currentHistoryId) {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                await fetch("/api/history", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ id: currentHistoryId, results: newResults })
                });
            } catch (e) { console.error("Failed to update history favorite"); }
        }

        // Update template if it exists
        if (currentTemplateId) {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                await fetch("/api/templates", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ id: currentTemplateId, results: newResults })
                });
            } catch (e) { console.error("Failed to update template favorite"); }
        }
    };

    const handleRate = async (index: number, rating: number) => {
        const newResults = [...results];
        newResults[index].rating = rating;
        setResults(newResults);

        if (currentHistoryId) {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                await fetch(`/api/prompts/${currentHistoryId}/rating`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        modelName: newResults[index].name,
                        rating
                    })
                });
            } catch (e) {
                console.error("Failed to submit rating", e);
            }
        }
    };

    const handlePinResponse = async (index: number) => {
        const newResults = results.map((r, i) => ({
            ...r,
            isPinned: i === index ? !r.isPinned : false // Only one pinned response at a time
        }));
        setResults(newResults);
    };

    const handleReRunWithTweak = async (index: number, tweakedPrompt: string) => {
        const modelToRun = results[index];
        const newResults = [...results];
        newResults[index] = { ...modelToRun, status: "error", error: "Re-running..." };
        setResults(newResults);

        try {
            const finalPrompt = testInput ? `${tweakedPrompt}\n\n[INPUT DATA]:\n${testInput}` : tweakedPrompt;
            const requirements = {
                mustBeJson: inputs.outputFormat.toLowerCase().includes("json")
            };

            const res = await fetch("/api/generate/response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    requirements,
                    model: modelToRun.name
                }),
            });
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const updatedResults = [...results];
                updatedResults[index] = data.results[0];
                setResults(updatedResults);
            }
        } catch (e) {
            const errorResults = [...results];
            errorResults[index] = { ...modelToRun, status: "error", error: "Failed to re-run" };
            setResults(errorResults);
        }
    };

    const handleExport = (format: 'md' | 'pdf' | 'json') => {
        const bestResult = results.find((_, i) => recommendation?.bestIndex === i);
        const exportData: ExportData = {
            prompt: generatedPrompt,
            modelName: bestResult?.name,
            response: bestResult?.text,
            metadata: bestResult ? {
                duration: bestResult.duration,
                tokens: Math.round((bestResult.text?.length || 0) / 4),
                cost: (Math.round((bestResult.text?.length || 0) / 4) / 1000) * 0.002,
                score: bestResult.evaluation?.score
            } : undefined
        };

        const filename = `echoprompt-${new Date().getTime()}`;
        if (format === 'md') downloadMarkdown(exportData, `${filename}.md`);
        else if (format === 'pdf') downloadPDF(exportData, `${filename}.pdf`);
        else if (format === 'json') downloadJSON(exportData, `${filename}.json`);
    };

    const handleSaveToHistory = async (finalResults: ModelResult[]) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const method = currentHistoryId ? "PATCH" : "POST";
            const body: any = {
                inputs,
                evaluation,
                generatedPrompt,
                testInput,
                results: finalResults
            };

            if (currentHistoryId) {
                body.id = currentHistoryId;
            }

            const res = await fetch("/api/history", {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data._id) {
                setCurrentHistoryId(data._id);
            }
            // Update versions if returned
            if (data.versions) {
                setVersions(data.versions);
            }
        } catch (e) {
            console.error("Failed to save history");
        }
    };

    const handleGenerateResponses = async () => {
        setIsGeneratingResponses(true);
        setResults([]);
        try {
            const finalPrompt = testInput ? `${generatedPrompt}\n\n[INPUT DATA]:\n${testInput}` : generatedPrompt;

            const requirements = {
                mustBeJson: inputs.outputFormat.toLowerCase().includes("json")
            };

            const res = await fetch("/api/generate/response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt, requirements }),
            });
            const data = await res.json();
            if (data.results) {
                setResults(data.results);

                // Calculate recommendation
                const rec = recommendBestModel(data.results, { outputFormat: inputs.outputFormat });
                setRecommendation(rec);

                handleSaveToHistory(data.results);
            }
        } catch (e) {
            alert("Failed to generate responses");
        } finally {
            setIsGeneratingResponses(false);
        }
    };

    const handleSaveTemplate = async () => {
        const name = prompt("Enter a name for this template:");
        if (!name) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please login to save templates");
                return;
            }

            const res = await fetch("/api/templates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    inputs,
                    generatedPrompt,
                    testInput,
                    evaluation,
                    results,
                    historyId: currentHistoryId || undefined
                })
            });

            if (res.ok) {
                // If saved successfully, also update the history name to match
                if (currentHistoryId) {
                    await fetch("/api/history", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            id: currentHistoryId,
                            name: name // Sync name
                        })
                    });
                }
                alert("Template saved!");
            } else {
                alert("Failed to save template");
            }
        } catch (e) {
            alert("Error saving template");
        }
    };

    const handleSaveToLibrary = async () => {
        const title = prompt("Enter a title for this Prompt Library item:", inputs.task ? inputs.task.substring(0, 50) : "Untitled Prompt");
        if (!title) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const formattedResponses = results.filter(r => r.status === 'success' && r.text).map(r => ({
                model: r.name,
                text: r.text,
                duration: r.duration,
                cost: 0, // Placeholder
                timestamp: new Date()
            }));

            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    originalPrompt: inputs.task,
                    optimizedPrompt: generatedPrompt || inputs.task,
                    tags: [inputs.role, inputs.tone, inputs.outputFormat].filter(Boolean),
                    responses: formattedResponses
                })
            });

            if (res.ok) {
                alert("Saved to Prompt Library! 🚀");
            } else {
                alert("Failed to save to library.");
            }
        } catch (e) {
            console.error("Library save failed", e);
            alert("Error saving to library");
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="container mx-auto p-6 min-h-screen space-y-8 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompt Builder</h1>
                    <p className="text-muted-foreground">Craft, Evaluate, and Execute.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-3 py-1.5 border border-white/5">
                        <GraduationCap className={`w-4 h-4 ${isLearningMode ? "text-yellow-400" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${isLearningMode ? "text-yellow-400" : "text-muted-foreground"}`}>
                            Learning Mode
                        </span>
                        <Switch
                            checked={isLearningMode}
                            onCheckedChange={setIsLearningMode}
                            className="scale-75 ml-1"
                        />
                    </div>
                    <Button
                        variant={isFocusMode ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="gap-2"
                    >
                        {isFocusMode ? <Maximize2 className="w-4 h-4 text-primary" /> : <Maximize2 className="w-4 h-4" />}
                        {isFocusMode ? "Exit Focus" : "Focus Mode"}
                    </Button>
                    <Button variant="outline" onClick={handleSaveTemplate} disabled={!inputs.task}>
                        Save as Template
                    </Button>
                    <Button onClick={handleSaveToLibrary} disabled={!inputs.task} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-none text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save to Library
                    </Button>
                </div>
            </header>

            {!isFocusMode && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-10 duration-500">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Define Intent</CardTitle>
                                <CardDescription>What do you want the AI to do?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3 pb-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 focus:text-primary transition-colors">Execution Styles</Label>
                                    <StylePresetSelector onSelect={handleApplyPreset} />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Input
                                            id="role"
                                            placeholder="e.g. Senior Copywriter"
                                            value={inputs.role}
                                            onChange={(e) => handleChange("role", e.target.value)}
                                        />
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {SUGGESTIONS.role.map((s, i) => (
                                                <SuggestionChip key={i} label={s} onClick={() => handleChange("role", s)} />
                                            ))}
                                        </div>
                                        {!inputs.role && (
                                            <p className="text-[11px] text-yellow-500 pt-1 animate-in fade-in slide-in-from-top-1">
                                                ⚠️ Who should the AI act as? (e.g. 'Expert Coder')
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="task">Task *</Label>
                                        <Textarea
                                            id="task"
                                            placeholder="Describe the task in detail..."
                                            value={inputs.task}
                                            onChange={(e) => handleChange("task", e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {SUGGESTIONS.task.map((s, i) => (
                                                <SuggestionChip key={i} label={s} onClick={() => handleChange("task", s)} />
                                            ))}
                                        </div>
                                        {inputs.task.length > 0 && inputs.task.length < 15 && (
                                            <p className="text-[11px] text-blue-500 pt-1 animate-in fade-in slide-in-from-top-1">
                                                ℹ️ Task is very short. Adding details improves quality.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="context">Context</Label>
                                        <Textarea
                                            id="context"
                                            placeholder="Background info, constraints..."
                                            value={inputs.context}
                                            onChange={(e) => handleChange("context", e.target.value)}
                                        />
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {SUGGESTIONS.context.map((s, i) => (
                                                <SuggestionChip key={i} label={s} onClick={() => handleChange("context", s)} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tone">Tone</Label>
                                            <Input
                                                id="tone"
                                                placeholder="e.g. Professional"
                                                value={inputs.tone}
                                                onChange={(e) => handleChange("tone", e.target.value)}
                                            />
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {SUGGESTIONS.tone.map((s, i) => (
                                                    <SuggestionChip key={i} label={s} onClick={() => handleChange("tone", s)} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="format">Output Format</Label>
                                            <Input
                                                id="format"
                                                placeholder="e.g. JSON"
                                                value={inputs.outputFormat}
                                                onChange={(e) => handleChange("outputFormat", e.target.value)}
                                            />
                                            {!inputs.outputFormat && (
                                                <p className="text-[11px] text-blue-400 pt-1 animate-in fade-in slide-in-from-top-1">
                                                    💡 Tip: Specify a format (e.g. Markdown, JSON, List).
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 pt-4 border-t border-border/50">
                                    <input
                                        type="checkbox"
                                        id="advanced-mode"
                                        checked={advancedMode}
                                        onChange={(e) => setAdvancedMode(e.target.checked)}
                                        className="accent-primary w-4 h-4"
                                    />
                                    <Label htmlFor="advanced-mode" className="cursor-pointer font-medium">Advanced Mode</Label>
                                </div>

                                {advancedMode && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="temperature">Temperature ({inputs.temperature})</Label>
                                            <input
                                                type="range"
                                                id="temperature"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={inputs.temperature}
                                                onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                                                className="w-full accent-primary"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Precise (0.0)</span>
                                                <span>Balanced (0.5)</span>
                                                <span>Creative (1.0)</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                Controls randomness. Lower values are deterministic and factual; higher values are more creative and varied.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="maxTokens">Max Tokens</Label>
                                            <Input
                                                id="maxTokens"
                                                type="number"
                                                value={inputs.maxTokens}
                                                onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                                            />
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                Limits response length. 1000 tokens ≈ 750 words. Increase this for longer, detailed outputs.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                className="w-full"
                                                disabled={evaluation.score < 20 || isGeneratingPrompt}
                                                onClick={handleGeneratePrompt}
                                            >
                                                {isGeneratingPrompt ? <Loader2 className="animate-spin mr-2" /> : null}
                                                {isGeneratingPrompt ? "Generating..." : "Generate Optimized Prompt"}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ctrl + Enter</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardFooter>
                        </Card>

                        {/* RAG Context Manager */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Context Sources (RAG)</CardTitle>
                                        <CardDescription>Upload documents to enhance prompts with relevant context</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="enable-rag" className="text-sm cursor-pointer">Enable</Label>
                                        <Switch
                                            id="enable-rag"
                                            checked={enableRAG}
                                            onCheckedChange={setEnableRAG}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            {enableRAG && (
                                <CardContent>
                                    <ContextManager
                                        selectedDocIds={selectedDocIds}
                                        onSelectionChange={setSelectedDocIds}
                                    />
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Quality Evaluation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-6">
                                    <PromptQualityMeter
                                        score={evaluation.score}
                                        historicalScores={versions.map(v => v.score || 0).filter(s => s > 0).concat(evaluation.score)}
                                        ruleLog={evaluation.ruleLog}
                                    />

                                    <div className="flex justify-end pt-1 gap-4 items-center">
                                        {usage && (
                                            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
                                                <span className="text-muted-foreground">Credits:</span>
                                                <span className={usage.current >= usage.limit ? "text-red-400" : "text-emerald-400"}>
                                                    {Math.max(0, usage.limit - usage.current)} left
                                                </span>
                                            </div>
                                        )}
                                        {previousInputs ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleUndoSuggestions}
                                                className="text-xs h-7 text-muted-foreground hover:text-red-400"
                                            >
                                                Undo Changes
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleApplySuggestions}
                                                disabled={evaluation.score === 100}
                                                className="text-xs h-7 border-blue-500/30 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                ✨ Apply Suggestions
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {evaluation.issues.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <Label className="font-semibold text-red-400 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Found Issues
                                        </Label>
                                        <div className="grid gap-2">
                                            {evaluation.issues.map((issue, i) => {
                                                const explanation = isLearningMode ? getExplanation(issue) : null;
                                                return (
                                                    <div key={i} className="group">
                                                        <div className="flex items-start gap-2 text-sm bg-red-500/10 p-2.5 rounded text-red-200 border border-red-500/10">
                                                            <span className="mt-0.5">•</span>
                                                            <span>{issue}</span>
                                                        </div>
                                                        {explanation && (
                                                            <div className="ml-4 mt-1 p-3 bg-yellow-500/5 border-l-2 border-yellow-500/30 rounded-r text-xs text-muted-foreground animate-in slide-in-from-top-1 fade-in duration-300">
                                                                <p className="font-semibold text-yellow-500/90 mb-1 flex items-center gap-1.5">
                                                                    <Lightbulb className="w-3 h-3" />
                                                                    Why this matters:
                                                                </p>
                                                                {explanation.explanation}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {isLearningMode && dailyTip && (
                                    <div className="mt-4 p-3 bg-blue-500/5 rounded border border-blue-500/10 flex gap-3 items-start">
                                        <div className="p-1.5 bg-blue-500/10 rounded-full mt-0.5">
                                            <GraduationCap className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">Pro Tip</h4>
                                            <p className="text-xs text-blue-200/80 italic">"{dailyTip}"</p>
                                        </div>
                                    </div>
                                )}
                                {evaluation.suggestions.length > 0 && (
                                    <div className="space-y-3 pt-4">
                                        <Label className="font-semibold text-blue-400 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" />
                                            Actionable Suggestions
                                        </Label>
                                        <div className="grid gap-3">
                                            {evaluation.suggestions.map((s, i) => (
                                                <div key={i} className="p-3 bg-blue-500/5 rounded border border-blue-500/10 animate-in slide-in-from-right-2 fade-in duration-300">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-500/30 text-blue-400/80 bg-blue-500/5">
                                                            {s.rule}
                                                        </Badge>
                                                        <span className="text-sm font-medium text-blue-100/90">{s.text}</span>
                                                    </div>
                                                    <div className="flex gap-2 items-start pl-1 border-l-2 border-blue-500/20 ml-1">
                                                        <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                                                            <span className="text-blue-400/60 not-italic font-bold mr-1">Why:</span>
                                                            {s.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {generatedPrompt && (
                            <Card className="border-primary">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle>3. Final Prompt</CardTitle>
                                            {isFallbackMode && (
                                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10 text-[10px] gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Offline Mode
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>Edit before sending to LLMs.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-md border border-white/5 mr-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-400" onClick={() => handleExport('md')}>
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Export as Markdown</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => handleExport('pdf')}>
                                                            <FileType className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Export as PDF</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-yellow-400" onClick={() => handleExport('json')}>
                                                            <FileJson className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Export as JSON</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        <Button
                                            variant={showDiff ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowDiff(!showDiff)}
                                            className="gap-2"
                                        >
                                            <GitCompare className="w-4 h-4" />
                                            {showDiff ? "Hide" : "Show"} Diff
                                        </Button>
                                        {versions.length > 0 && (
                                            <select
                                                className="text-xs bg-background border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary"
                                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                                value={generatedPrompt}
                                            >
                                                <option value={generatedPrompt} disabled>Current Edit</option>
                                                {versions.map((v, i) => (
                                                    <option key={i} value={v.content}>
                                                        {v.label} ({new Date(v.timestamp).toLocaleTimeString()})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {showDiff ? (
                                        <PromptDiff
                                            originalPrompt={inputs.task}
                                            optimizedPrompt={generatedPrompt}
                                        />
                                    ) : (
                                        <div className={cn(
                                            "relative group rounded-lg overflow-hidden border border-white/10 bg-zinc-950/40 transition-all duration-500 ease-in-out",
                                            isPreviewExpanded ? "min-h-[600px]" : "h-[300px]"
                                        )}>
                                            <Textarea
                                                className={cn(
                                                    "w-full h-full p-6 font-mono text-sm bg-transparent border-none focus-visible:ring-0 resize-none custom-scrollbar leading-relaxed",
                                                    "whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden selection:bg-primary/30"
                                                )}
                                                value={generatedPrompt}
                                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                            />
                                            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-zinc-900/90 backdrop-blur-md border border-white/10 hover:bg-zinc-800"
                                                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                                >
                                                    {isPreviewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-zinc-900/90 backdrop-blur-md border border-white/10 hover:bg-zinc-800"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(generatedPrompt);
                                                        setCopiedIndex(999);
                                                        setTimeout(() => setCopiedIndex(null), 2000);
                                                    }}
                                                >
                                                    {copiedIndex === 999 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                            {!isPreviewExpanded && (
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none flex items-end justify-center pb-2 cursor-pointer group/fade"
                                                    onClick={() => setIsPreviewExpanded(true)}
                                                >
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-0 group-hover/fade:opacity-100 transition-opacity">Click to Expand</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardContent className="border-t pt-6">
                                    <Label className="mb-2 block text-blue-400">4. Test Data / Variables (Optional)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Content to be processed by the prompt (e.g. the article to summarize, or the code to debug).
                                    </p>
                                    <Textarea
                                        className="min-h-[100px] font-mono text-sm border-blue-500/20"
                                        placeholder="Paste your test input here..."
                                        value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                    />
                                </CardContent>
                                <CardFooter>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    className="w-full"
                                                    size="lg"
                                                    onClick={handleGenerateResponses}
                                                    disabled={isGeneratingResponses}
                                                >
                                                    {isGeneratingResponses ? "Running Models..." : "Generate Responses (Multi-LLM)"}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Ctrl + Shift + Enter</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </div>
            )
            }

            {
                (results.length > 0 || isGeneratingResponses) && (
                    <div className="pt-10 border-t border-border/40">
                        <ModelResultsGrid
                            results={results}
                            onToggleFavorite={handleFavorite}
                            onCopy={handleCopy}
                            copiedIndex={copiedIndex}
                            isLoading={isGeneratingResponses}
                            recommendation={recommendation}
                            onRate={handleRate}
                            onPin={handlePinResponse}
                            onReRun={handleReRunWithTweak}
                        />
                    </div>
                )
            }
        </div >
    );
}

export default function PromptBuilderPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <PromptBuilderContent />
        </Suspense>
    );
}
