"use client";

import { useState } from "react";
import { computeDiff, type DiffPart } from "@/lib/diff-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, SplitSquareHorizontal, FileText, TrendingUp, TrendingDown } from "lucide-react";

interface PromptDiffProps {
    originalPrompt: string;
    optimizedPrompt: string;
    className?: string;
}

export function PromptDiff({ originalPrompt, optimizedPrompt, className = "" }: PromptDiffProps) {
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
    const [copied, setCopied] = useState<'original' | 'optimized' | null>(null);

    const diff = computeDiff(originalPrompt, optimizedPrompt);

    // Calculate statistics
    const stats = {
        added: diff.filter(d => d.type === 'added').length,
        removed: diff.filter(d => d.type === 'removed').length,
        unchanged: diff.filter(d => d.type === 'same').length,
    };

    const totalWords = stats.added + stats.removed + stats.unchanged;
    const changePercent = totalWords > 0 ? Math.round(((stats.added + stats.removed) / totalWords) * 100) : 0;

    const handleCopy = (text: string, type: 'original' | 'optimized') => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const renderDiffText = (parts: DiffPart[], showRemoved: boolean, showAdded: boolean) => {
        return (
            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {parts.map((part, index) => {
                    if (part.type === 'same') {
                        return (
                            <span key={index} className="text-foreground">
                                {part.value}{' '}
                            </span>
                        );
                    } else if (part.type === 'removed' && showRemoved) {
                        return (
                            <span
                                key={index}
                                className="bg-red-500/20 text-red-300 line-through px-0.5 rounded"
                            >
                                {part.value}
                            </span>
                        );
                    } else if (part.type === 'added' && showAdded) {
                        return (
                            <span
                                key={index}
                                className="bg-green-500/20 text-green-300 px-0.5 rounded font-medium"
                            >
                                {part.value}{' '}
                            </span>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <Card className={`border-white/10 ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Prompt Comparison</CardTitle>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="gap-1 text-green-400 border-green-400/30">
                                <TrendingUp className="w-3 h-3" />
                                +{stats.added}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-red-400 border-red-400/30">
                                <TrendingDown className="w-3 h-3" />
                                -{stats.removed}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                {changePercent}% changed
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'split' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('split')}
                            className="gap-2"
                        >
                            <SplitSquareHorizontal className="w-4 h-4" />
                            Split
                        </Button>
                        <Button
                            variant={viewMode === 'unified' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('unified')}
                            className="gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Unified
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'split' ? (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Original Prompt */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Original Prompt</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(originalPrompt, 'original')}
                                    className="h-7 gap-2"
                                >
                                    {copied === 'original' ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 max-h-96 overflow-auto">
                                {renderDiffText(diff, true, false)}
                            </div>
                        </div>

                        {/* Optimized Prompt */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Optimized Prompt</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(optimizedPrompt, 'optimized')}
                                    className="h-7 gap-2"
                                >
                                    {copied === 'optimized' ? (
                                        <>
                                            <Check className="w-3 h-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg border border-white/5 max-h-96 overflow-auto">
                                {renderDiffText(diff, false, true)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">Unified Diff View</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(originalPrompt, 'original')}
                                    className="h-7 gap-2"
                                >
                                    {copied === 'original' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    Original
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(optimizedPrompt, 'optimized')}
                                    className="h-7 gap-2"
                                >
                                    {copied === 'optimized' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    Optimized
                                </Button>
                            </div>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5 max-h-96 overflow-auto">
                            {renderDiffText(diff, true, true)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 bg-red-500/20 border border-red-500/30 rounded"></span>
                                Removed
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-3 h-3 bg-green-500/20 border border-green-500/30 rounded"></span>
                                Added
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
