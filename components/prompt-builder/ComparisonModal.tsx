
import { ModelResult } from "./ModelResultCard";
import { computeDiff, DiffPart } from "@/lib/diff-utils";
import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface ComparisonModalProps {
    result1: ModelResult;
    result2: ModelResult;
    onClose: () => void;
}

export function ComparisonModal({ result1, result2, onClose }: ComparisonModalProps) {
    const diff = useMemo(() => computeDiff(result1.text || "", result2.text || ""), [result1.text, result2.text]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-2 text-zinc-100">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Response Comparison</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side (Result 1 - Reference) */}
                    <div className="flex-1 flex flex-col border-r border-white/10 bg-red-950/5">
                        <div className="p-3 border-b border-white/5 bg-zinc-900/30 flex justify-between items-center">
                            <span className="font-medium text-zinc-300">{result1.name}</span>
                            <span className="text-xs text-red-400 font-mono">Original / Removed</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm font-mono leading-relaxed whitespace-pre-wrap text-zinc-400">
                            {diff.map((part, i) => (
                                <span key={i} className={cn(
                                    part.type === 'removed' ? "bg-red-500/20 text-red-300 line-through decoration-red-500/50" :
                                        part.type === 'added' ? "hidden" : ""
                                )}>
                                    {part.value}{' '}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right Side (Result 2 - Variant) */}
                    <div className="flex-1 flex flex-col bg-green-950/5">
                        <div className="p-3 border-b border-white/5 bg-zinc-900/30 flex justify-between items-center">
                            <span className="font-medium text-zinc-300">{result2.name}</span>
                            <span className="text-xs text-green-400 font-mono">Modified / Added</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm font-mono leading-relaxed whitespace-pre-wrap text-zinc-400">
                            {diff.map((part, i) => (
                                <span key={i} className={cn(
                                    part.type === 'added' ? "bg-green-500/20 text-green-300" :
                                        part.type === 'removed' ? "hidden" : ""
                                )}>
                                    {part.value}{' '}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-zinc-900/50 text-center text-xs text-muted-foreground">
                    Comparisons are based on simple word-level differences.
                </div>
            </div>
        </div>
    );
}
