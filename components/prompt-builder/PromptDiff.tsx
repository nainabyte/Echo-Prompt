"use client";

import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { computeDiff } from "@/lib/diff-utils";

interface PromptDiffProps {
    originalPrompt: string;
    optimizedPrompt: string;
    className?: string;
}

export function PromptDiff({ originalPrompt, optimizedPrompt, className = "" }: PromptDiffProps) {

    const diff = computeDiff(originalPrompt, optimizedPrompt);

    // Calculate statistics
    const stats = {
        added: diff.filter(d => d.type === 'added').length,
        removed: diff.filter(d => d.type === 'removed').length,
        unchanged: diff.filter(d => d.type === 'same').length,
    };

    const totalWords = stats.added + stats.removed + stats.unchanged;
    const changePercent = totalWords > 0 ? Math.round(((stats.added + stats.removed) / totalWords) * 100) : 0;


    const diffStyles = {
        variables: {
            dark: {
                diffViewerBackground: 'transparent',
                diffViewerColor: '#d4d4d8',
                addedBackground: 'rgba(34, 197, 94, 0.15)',
                addedColor: '#4ade80',
                removedBackground: 'rgba(239, 68, 68, 0.15)',
                removedColor: '#f87171',
                wordAddedBackground: 'rgba(34, 197, 94, 0.3)',
                wordRemovedBackground: 'rgba(239, 68, 68, 0.3)',
                addedGutterBackground: 'rgba(34, 197, 94, 0.1)',
                removedGutterBackground: 'rgba(239, 68, 68, 0.1)',
                gutterBackground: 'transparent',
                gutterColor: '#71717a',
                codeFoldGutterBackground: 'transparent',
                codeFoldBackground: 'transparent',
                emptyLineBackground: 'transparent',
                lineNumberColor: '#52525b',
                diffViewerTitleBackground: 'transparent',
                diffViewerTitleColor: '#d4d4d8',
            },
        },
        diffContainer: {
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
        },
        line: {
            fontSize: 'var(--text-sm)',
            lineHeight: '1.6',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            whiteSpace: 'pre',
            wordBreak: 'keep-all' as const,
            overflow: 'visible',
        },
        gutter: {
            padding: '0 1rem',
        }
    };

    return (
        <Card className={`border-white/10 ${className}`}>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">Prompt Comparison</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1 text-green-400 border-green-400/30 bg-green-400/5">
                                <TrendingUp className="w-3 h-3" />
                                {stats.added} additions
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-red-400 border-red-400/30 bg-red-400/5">
                                <TrendingDown className="w-3 h-3" />
                                {stats.removed} deletions
                            </Badge>
                            <Badge variant="outline" className="gap-1 bg-white/5">
                                {changePercent}% modified
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">

                <div className="bg-zinc-950/40 rounded-lg border border-white/10 overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500 custom-scrollbar">
                    <div className="min-w-max">
                        <ReactDiffViewer
                            oldValue={originalPrompt}
                            newValue={optimizedPrompt}
                            splitView={false}
                            useDarkTheme={true}
                            styles={diffStyles}
                            compareMethod={DiffMethod.WORDS}
                            hideLineNumbers={false}
                        />
                    </div>
                </div>

                <div className="text-[10px] text-muted-foreground/60 flex items-center gap-4 px-2">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500/40 border border-red-500/20"></span>
                        Removed
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500/40 border border-green-500/20"></span>
                        Added
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
