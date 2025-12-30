
import { useState, useRef, useEffect } from "react";
import { ModelResultCard, type ModelResult } from "./ModelResultCard";
import { LayoutGrid, Maximize2, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "../ui/switch";
import { Label } from "@/components/ui/label";
import { type Recommendation } from "@/lib/recommendation-engine";
import { ComparisonModal } from "./ComparisonModal";
import { ArrowRightLeft } from "lucide-react";

interface ModelResultsGridProps {
    results: ModelResult[];
    onToggleFavorite: (index: number) => void;
    onCopy: (text: string, index: number) => void;
    copiedIndex: number | null;
    isLoading?: boolean;
    recommendation?: Recommendation | null;
}

function SkeletonCard() {
    return (
        <div className="flex flex-col h-[600px] rounded-xl border border-white/5 bg-zinc-900/20 overflow-hidden animate-pulse">
            <div className="h-14 border-b border-white/5 bg-zinc-900/40 p-3 flex justify-between items-center">
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-800/50" />
                    <div className="space-y-1.5">
                        <div className="w-24 h-3 rounded bg-zinc-800/50" />
                        <div className="w-16 h-2 rounded bg-zinc-800/30" />
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="w-7 h-7 rounded bg-zinc-800/30" />
                    <div className="w-7 h-7 rounded bg-zinc-800/30" />
                </div>
            </div>
            <div className="flex-1 p-4 space-y-3">
                <div className="w-3/4 h-3 rounded bg-zinc-800/40" />
                <div className="w-full h-3 rounded bg-zinc-800/30" />
                <div className="w-5/6 h-3 rounded bg-zinc-800/30" />
                <div className="w-full h-3 rounded bg-zinc-800/20" />
                <div className="w-2/3 h-3 rounded bg-zinc-800/20" />
            </div>
            <div className="h-10 border-t border-white/5 bg-zinc-900/30 flex justify-between items-center px-4">
                <div className="w-20 h-3 rounded bg-zinc-800/40" />
                <div className="w-16 h-6 rounded bg-zinc-800/40" />
            </div>
        </div>
    );
}

export function ModelResultsGrid({ results, onToggleFavorite, onCopy, copiedIndex, isLoading = false, recommendation }: ModelResultsGridProps) {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [syncScroll, setSyncScroll] = useState(true);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [showComparison, setShowComparison] = useState(false);

    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrolling = useRef(false);

    const handleToggleFocus = (index: number) => {
        setFocusedIndex(current => current === index ? null : index);
    };

    const handleToggleSelection = (index: number) => {
        setSelectedIndices(current => {
            if (current.includes(index)) {
                return current.filter(i => i !== index);
            }
            if (current.length < 2) {
                return [...current, index];
            }
            return current;
        });
    };

    const handleScroll = (e: Event) => {
        if (!syncScroll || isScrolling.current) return;

        const target = e.target as HTMLDivElement;
        const scrollTop = target.scrollTop;

        isScrolling.current = true;
        cardRefs.current.forEach(ref => {
            if (ref && ref !== target) {
                ref.scrollTop = scrollTop;
            }
        });

        requestAnimationFrame(() => {
            isScrolling.current = false;
        });
    };

    useEffect(() => {
        const refs = cardRefs.current;
        refs.forEach(ref => {
            if (ref) ref.addEventListener('scroll', handleScroll);
        });

        return () => {
            refs.forEach(ref => {
                if (ref) ref.removeEventListener('scroll', handleScroll);
            });
        };
    }, [syncScroll, results]);

    if (!isLoading && results.length === 0) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    Model Results
                </h2>
                {!isLoading && results.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="sync-scroll" className="text-sm font-medium cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                {syncScroll ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                                Sync Scroll
                            </Label>
                            <Switch id="sync-scroll" checked={syncScroll} onCheckedChange={setSyncScroll} />
                        </div>
                    </div>
                )}
            </div>

            <div className={focusedIndex !== null && !isLoading ? "flex gap-6 h-[700px]" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                {isLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    results.map((res, idx) => {
                        if (focusedIndex !== null && focusedIndex !== idx) return null;

                        return (
                            <div key={idx} className={focusedIndex === idx ? "w-full h-full flex-1" : ""}>
                                <ModelResultCard
                                    ref={(el) => { if (el) cardRefs.current[idx] = el; }}
                                    result={res}
                                    index={idx}
                                    onToggleFavorite={onToggleFavorite}
                                    onCopy={onCopy}
                                    copiedIndex={copiedIndex}
                                    isFocused={focusedIndex === idx}
                                    onToggleFocus={handleToggleFocus}
                                    isRecommended={recommendation?.bestIndex === idx}
                                    recommendationReason={recommendation?.reason}
                                    isSelected={selectedIndices.includes(idx)}
                                    onToggleSelection={handleToggleSelection}
                                    selectionDisabled={selectedIndices.length >= 2 && !selectedIndices.includes(idx)}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Comparison Floating Action Button */}
            {selectedIndices.length === 2 && !showComparison && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 fade-in">
                    <Button
                        size="lg"
                        className="rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-105 transition-all gap-2"
                        onClick={() => setShowComparison(true)}
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                        Compare Responses
                    </Button>
                </div>
            )}

            {/* Comparison Modal */}
            {showComparison && selectedIndices.length === 2 && (
                <ComparisonModal
                    result1={results[selectedIndices[0]]}
                    result2={results[selectedIndices[1]]}
                    onClose={() => setShowComparison(false)}
                />
            )}

            {focusedIndex !== null && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={() => setFocusedIndex(null)}>
                        Back to Grid View
                    </Button>
                </div>
            )}
        </div>
    );
}
