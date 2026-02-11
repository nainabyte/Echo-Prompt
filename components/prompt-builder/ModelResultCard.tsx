import { useState, useRef, useEffect, forwardRef } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Star, Copy, Check, AlertCircle, Maximize2, Zap, Clock,
    ThumbsUp, ThumbsDown, Pin, Edit3, Send, X, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModelResult {
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

interface ModelResultCardProps {
    result: ModelResult;
    index: number;
    onToggleFavorite: (index: number) => void;
    onCopy: (text: string, index: number) => void;
    copiedIndex: number | null;
    isFocused?: boolean;
    onToggleFocus?: (index: number) => void;
    isRecommended?: boolean;
    recommendationReason?: string;
    isSelected?: boolean;
    onToggleSelection?: (index: number) => void;
    selectionDisabled?: boolean;
    onRate?: (index: number, rating: number) => void;
    onPin?: (index: number) => void;
    onReRun?: (index: number, tweakedPrompt: string) => void;
}

export const ModelResultCard = forwardRef<HTMLDivElement, ModelResultCardProps>(({
    result,
    index,
    onToggleFavorite,
    onCopy,
    copiedIndex,
    isFocused = false,
    onToggleFocus,
    isRecommended,
    recommendationReason,
    isSelected = false,
    onToggleSelection,
    selectionDisabled = false,
    onRate,
    onPin,
    onReRun
}, ref) => {
    const isSuccess = result.status === 'success';
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [tweakedPrompt, setTweakedPrompt] = useState("");

    // Glass-Tech Styles
    const cardBaseClasses = cn(
        "flex flex-col h-[600px] transition-all duration-500 ease-spring relative overflow-hidden group/card",
        "bg-zinc-900/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/10",
        "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1",
        "animate-in fade-in slide-in-from-bottom-8 zoom-in-95 fill-mode-both",
        result.isFavorite ? "border-yellow-500/50 ring-1 ring-yellow-500/20" : "",
        isRecommended ? "border-blue-500/50 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10" : "",
        isSelected ? "border-primary ring-2 ring-primary shadow-2xl shadow-primary/20 scale-[1.02]" : "",
        result.status === 'error' ? "border-red-500/30 bg-red-950/10" : ""
    );

    const animationDelay = { animationDelay: `${index * 100}ms` };

    const estimatedTokens = Math.round((result.text?.length || 0) / 4);
    const estimatedCost = result.cost || (estimatedTokens / 1000) * 0.002; // Default estimation

    return (
        <Card className={cardBaseClasses} style={animationDelay as any}>
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", isSuccess ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                        {isSuccess ? <Zap className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-zinc-100">{result.name}</h3>
                            {result.isPinned && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-4 px-1 px-1.5">
                                    <Pin className="w-2.5 h-2.5 mr-1 fill-current" />
                                    Pinned
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                            {isSuccess ? (
                                <span className={result.duration < 1000 ? "text-green-500" : result.duration < 3000 ? "text-yellow-500" : "text-red-500"}>
                                    {result.duration}ms
                                </span>
                            ) : <span>Failed</span>}
                            <span>•</span>
                            <span>AI Model</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSuccess && result.evaluation && (
                        <div className="hidden sm:flex flex-wrap gap-1 justify-end mr-2">
                            {result.evaluation.isValidJson && (
                                <Badge variant="outline" className="text-[10px] h-5 bg-green-500/5 text-green-500 border-green-500/20">JSON</Badge>
                            )}
                            <Badge variant="outline" className={cn(
                                "text-[10px] h-5 border-white/10",
                                result.evaluation.score >= 80 ? "text-green-400" : result.evaluation.score >= 50 ? "text-yellow-400" : "text-red-400"
                            )}>
                                Score: {result.evaluation.score}
                            </Badge>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border border-white/5">
                        {onToggleFocus && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => onToggleFocus(index)}>
                                <Maximize2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 transition-colors group", result.isFavorite ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400")}
                            onClick={() => onToggleFavorite(index)}
                        >
                            <Star className={cn("w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12 group-active:scale-90", result.isFavorite && "fill-current")} />
                        </Button>
                        {onPin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 transition-colors", result.isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}
                                onClick={() => onPin(index)}
                            >
                                <Pin className={cn("w-3.5 h-3.5", result.isPinned && "fill-current")} />
                            </Button>
                        )}
                        {isSuccess && onReRun && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 transition-colors", isEditingPrompt ? "text-blue-400 bg-blue-400/10" : "text-muted-foreground hover:text-blue-400")}
                                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                            >
                                {isEditingPrompt ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* SCROLLABLE BODY */}
            <CardContent className="flex-1 p-0 overflow-hidden relative group">
                <div
                    ref={ref}
                    className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap"
                >
                    {isEditingPrompt ? (
                        <div className="bg-zinc-950/60 p-4 rounded-lg border border-blue-500/20 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Tweak Prompt</span>
                                <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-300/60">Inline Editor</Badge>
                            </div>
                            <Textarea
                                value={tweakedPrompt}
                                onChange={(e) => setTweakedPrompt(e.target.value)}
                                placeholder="Edit the prompt for this specific model..."
                                className="min-h-[150px] bg-black/40 border-white/10 text-xs font-mono focus:border-blue-500/50 transition-all resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-muted-foreground"
                                    onClick={() => setIsEditingPrompt(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 text-xs bg-blue-500 hover:bg-blue-600 gap-1.5"
                                    onClick={() => {
                                        onReRun?.(index, tweakedPrompt);
                                        setIsEditingPrompt(false);
                                    }}
                                >
                                    <Send className="w-3 h-3" />
                                    Re-run
                                </Button>
                            </div>
                        </div>
                    ) : (
                        isSuccess ? result.text : (
                            <div className="flex flex-col items-center justify-center h-full text-red-400 space-y-2">
                                <AlertCircle className="w-8 h-8 opacity-50" />
                                <p className="text-xs">{result.error || "Unknown error occurred"}</p>
                            </div>
                        )
                    )}
                </div>
            </CardContent>

            {/* METADATA FOOTER */}
            <div className="p-2 border-t border-white/5 bg-zinc-950/30 backdrop-blur-sm rounded-b-lg flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-3 px-2">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help" title="">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    <span>{result.duration / 1000}s</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Execution Time</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                    <Zap className="w-3 h-3 text-yellow-500/60" />
                                    <span>~{estimatedTokens} Tokens</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Estimated Token Usage</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help text-emerald-500/80">
                                    <DollarSign className="w-3 h-3" />
                                    <span>${estimatedCost.toFixed(4)}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Estimated Cost (per 1k tokens)</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex items-center gap-2 px-2">
                    {isSuccess && (
                        <div className="flex items-center gap-2 mr-2 border-r border-white/5 pr-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onRate?.(index, 5)}
                                            className={cn(
                                                "p-1 rounded hover:bg-white/5 transition-colors",
                                                (result.rating || 0) >= 4 ? "text-emerald-400 bg-emerald-500/5" : "text-zinc-600 hover:text-emerald-400/50"
                                            )}
                                        >
                                            <ThumbsUp className={cn("w-3.5 h-3.5", (result.rating || 0) >= 4 && "fill-current")} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Good Response</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onRate?.(index, 1)}
                                            className={cn(
                                                "p-1 rounded hover:bg-white/5 transition-colors",
                                                (result.rating || 0) > 0 && (result.rating || 0) <= 2 ? "text-red-400 bg-red-500/5" : "text-zinc-600 hover:text-red-400/50"
                                            )}
                                        >
                                            <ThumbsDown className={cn("w-3.5 h-3.5", (result.rating || 0) > 0 && (result.rating || 0) <= 2 && "fill-current")} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Poor Response</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        {onToggleSelection && (
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleSelection(index)}
                                disabled={!isSelected && selectionDisabled}
                                className={cn("h-7 w-7 border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary", !isSelected && selectionDisabled && "opacity-30")}
                            />
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 text-xs gap-1.5 transition-all duration-200 active:scale-90",
                                copiedIndex === index ? "text-green-400 bg-green-500/10" : "hover:bg-white/5"
                            )}
                            onClick={() => onCopy(result.text || "", index)}
                        >
                            {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span className="ml-1 hidden sm:inline">{copiedIndex === index ? "Copied" : "Copy"}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
});

ModelResultCard.displayName = "ModelResultCard";
