"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, Stethoscope } from "lucide-react";
import type { RuleTrace } from "@/lib/evaluation-model";

interface ExplainabilityPanelProps {
    ruleLog: RuleTrace[];
    score: number;
}

export function ExplainabilityPanel({ ruleLog, score }: ExplainabilityPanelProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary">
                    <Stethoscope className="w-3.5 h-3.5" />
                    View Logic
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Evaluation Logic Trace
                        <Badge variant="outline" className="ml-2 font-mono">
                            Score: {score}/100
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        A transparent look at how the prompt optimization score was calculated.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4 pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Rule Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="text-right">Impact</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ruleLog.map((rule, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{rule.description}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {rule.status === "pass" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            {rule.status === "fail" && <XCircle className="w-4 h-4 text-red-500" />}
                                            {rule.status === "info" && <Info className="w-4 h-4 text-blue-500" />}
                                            <span className="capitalize text-xs">{rule.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">
                                        {rule.scoreImpact > 0 ? `+${rule.scoreImpact}` : rule.scoreImpact}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <p>
                        <strong>Note:</strong> This logic is rule-based and deterministic. It analyzes structural components
                        (Role, Task, Context) rather than semantic quality.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
