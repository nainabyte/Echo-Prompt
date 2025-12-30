
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Copy, Check, AlertCircle, Maximize2, Zap, Clock } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ModelResult {
    name: string;
    status: "success" | "error";
    text?: string;
    error?: string;
    duration: number;
    isFavorite?: boolean;
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
    selectionDisabled?: boolean; // If 2 already selected and this isn't one of them
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
    selectionDisabled = false
}, ref) => {
    const isSuccess = result.status === 'success';

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

    return (
        <Card className={cardBaseClasses} style={animationDelay as any}>
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", isSuccess ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                        {isSuccess ? <Zap className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-100">{result.name}</h3>
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

                {isRecommended && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs gap-1 border-blue-500/20">
                        <Star className="w-3 h-3 fill-current" />
                        Best Choice
                    </Badge>
                )}

                <div className="flex items-center gap-2">
                    {onToggleSelection && (
                        <div className="flex items-center">
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleSelection(index)}
                                disabled={!isSelected && selectionDisabled}
                                className={cn("border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary", !isSelected && selectionDisabled && "opacity-30")}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
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
                </div>
            </div>

            {/* SCROLLABLE BODY */}
            <CardContent className="flex-1 p-0 overflow-hidden relative group">
                <div
                    ref={ref}
                    className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap"
                >
                    {isSuccess ? result.text : (
                        <div className="flex flex-col items-center justify-center h-full text-red-400 space-y-2">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                            <p className="text-xs">{result.error || "Unknown error occurred"}</p>
                        </div>
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
                                <div className="flex items-center gap-1.5 opacity-50 cursor-help">
                                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                    <span>~{Math.round((result.text?.length || 0) / 4)} Tokens</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Estimated Token Usage</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {isRecommended && recommendationReason && (
                        <span className="hidden sm:inline-block text-[10px] text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                            {recommendationReason}
                        </span>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 text-xs gap-1.5 transition-all duration-200 active:scale-90",
                        copiedIndex === index ? "text-green-400 bg-green-500/10" : "hover:bg-white/5"
                    )}
                    onClick={() => onCopy(result.text || "", index)}
                >
                    <span className={cn("transition-all duration-300 transform", copiedIndex === index ? "scale-100 rotate-0" : "scale-100 rotate-0")}>
                        {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </span>
                    <span className="ml-1">{copiedIndex === index ? "Copied" : "Copy"}</span>
                </Button>
            </div>
        </Card>
    );
});

ModelResultCard.displayName = "ModelResultCard";
