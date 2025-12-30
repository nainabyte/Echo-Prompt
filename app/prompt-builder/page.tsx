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
import { Copy, Star, Check, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ModelResultsGrid } from "@/components/prompt-builder/ModelResultsGrid";
import { ExplainabilityPanel } from "@/components/prompt-builder/ExplainabilityPanel";
import { Maximize2, Lightbulb, GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getExplanation, getRandomTip } from "@/lib/learning-content";

interface ModelResult {
    name: string;
    status: "success" | "error";
    text?: string;
    error?: string;
    duration: number;
    isFavorite?: boolean;
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
    const [versions, setVersions] = useState<{ label: string; content: string; timestamp: Date }[]>([]);

    // Tracking state
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isFallbackMode, setIsFallbackMode] = useState(false);
    const [usage, setUsage] = useState<{ current: number, limit: number } | null>(null);

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
                        }

                        // Note: We don't set currentHistoryId for templates to avoid accidentally converting a template to a history item on patch.
                        // Future improvement: Allow PATCHing templates for favorites.

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
                body: JSON.stringify({ inputs, evaluation, style }),
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
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        id: currentHistoryId,
                        results: newResults
                    })
                });
            } catch (e) {
                console.error("Failed to update favorite");
            }
        }
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

            const res = await fetch("/api/generate/response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt }),
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
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Input
                                        id="role"
                                        placeholder="e.g. Senior Copywriter"
                                        value={inputs.role}
                                        onChange={(e) => handleChange("role", e.target.value)}
                                    />
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

                                <div className="space-y-2">
                                    <Label>Prompt Style</Label>
                                    <div className="flex gap-2">
                                        {["Strict", "Creative", "Research"].map((s) => (
                                            <Button
                                                key={s}
                                                variant={style === s ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setStyle(s)}
                                            >
                                                {s}
                                            </Button>
                                        ))}
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
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Quality Evaluation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-semibold">Score</Label>
                                        <div className="flex items-center gap-3">
                                            {evaluation.ruleLog && evaluation.ruleLog.length > 0 && (
                                                <ExplainabilityPanel ruleLog={evaluation.ruleLog} score={evaluation.score} />
                                            )}
                                            <span className="text-2xl font-bold">{evaluation.score}/100</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getScoreColor(evaluation.score)}`}
                                            style={{ width: `${evaluation.score}%` }}
                                        />
                                    </div>
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
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-600 dark:text-blue-300">
                                        <p className="font-semibold mb-1">Suggestions:</p>
                                        <ul className="list-disc list-inside">
                                            {evaluation.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
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
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        className="min-h-[250px] font-mono text-sm"
                                        value={generatedPrompt}
                                        onChange={(e) => setGeneratedPrompt(e.target.value)}
                                    />
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
            )}

            {(results.length > 0 || isGeneratingResponses) && (
                <div className="pt-10 border-t border-border/40">
                    <ModelResultsGrid
                        results={results}
                        onToggleFavorite={handleFavorite}
                        onCopy={handleCopy}
                        copiedIndex={copiedIndex}
                        isLoading={isGeneratingResponses}
                        recommendation={recommendation}
                    />
                </div>
            )}
        </div>
    );
}

export default function PromptBuilderPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <PromptBuilderContent />
        </Suspense>
    );
}
