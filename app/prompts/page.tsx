"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel
} from "@tanstack/react-table";
import { Tooltip } from "react-tooltip";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    History,
    Clock,
    Tag,
    ChevronRight,
    Star,
    Trash2,
    ArrowUpDown,
    ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";

interface Prompt {
    _id: string;
    title: string;
    originalPrompt: string;
    versions: any[];
    responses: any[];
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
}

export default function PromptsPage() {
    const router = useRouter();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/prompts?search=${search}`);
            const data = await res.json();
            if (res.ok) {
                setPrompts(data.prompts);
            }
        } catch (error) {
            console.error("Failed to fetch prompts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchPrompts, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this prompt history?")) return;
        try {
            const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPrompts((prev) => prev.filter((p) => p._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const columnHelper = createColumnHelper<Prompt>();

    const columns = useMemo(() => [
        columnHelper.accessor("title", {
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="pl-0 hover:bg-transparent">
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <History className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <Link href={`/prompts/${info.row.original._id}`} className="font-semibold text-zinc-100 hover:text-primary transition-colors line-clamp-1">
                            {info.getValue()}
                        </Link>
                        {info.row.original.isFavorite && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 ml-2 text-yellow-500 border-yellow-500/20 bg-yellow-500/5">
                                Favorite
                            </Badge>
                        )}
                    </div>
                </div>
            )
        }),
        columnHelper.accessor("originalPrompt", {
            header: "Snippet",
            cell: info => <p className="text-xs text-muted-foreground line-clamp-1 max-w-[250px] font-mono">{info.getValue()}</p>
        }),
        columnHelper.accessor("createdAt", {
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="pl-0 hover:bg-transparent">
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: info => <span className="text-xs text-zinc-400">{format(new Date(info.getValue()), "MMM d, yyyy")}</span>
        }),
        columnHelper.accessor("versions", {
            header: "Versions",
            cell: info => <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 font-normal">{info.getValue().length}</Badge>
        }),
        columnHelper.accessor("_id", {
            header: "Actions",
            cell: info => (
                <div className="flex items-center gap-2">
                    <Link href={`/prompts/${info.getValue()}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" data-tooltip-id="global-tooltip" data-tooltip-content="View Details">
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(info.getValue())}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Delete Permanentally"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        })
    ], [columnHelper, handleDelete]);

    const table = useReactTable({
        data: prompts,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto p-6 max-w-6xl">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Prompt Library
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your prompt versions, test results, and optimizations.
                        </p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search prompts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-zinc-900/50 border-white/10 h-11"
                        />
                    </div>
                </header>

                <Card className="bg-zinc-900/10 border-white/5 overflow-hidden backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 bg-zinc-900/30 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <History className="w-4 h-4" />
                                All Prompts ({prompts.length})
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />
                                ))}
                            </div>
                        ) : prompts.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <History className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="text-sm">No prompt history found. Start building in the <Link href="/prompt-builder" className="text-primary hover:underline">Prompt Builder</Link>.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id} className="border-b border-white/5 bg-zinc-900/20">
                                                {headerGroup.headers.map(header => (
                                                    <th key={header.id} className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {table.getRowModel().rows.map(row => (
                                            <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="px-6 py-4">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                    <div className="border-t border-white/5 p-4 bg-zinc-900/30 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Showing {table.getFilteredRowModel().rows.length} prompts
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="h-8 text-xs border-white/5 disabled:opacity-30"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="h-8 text-xs border-white/5 disabled:opacity-30"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
            <Tooltip id="global-tooltip" style={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }} />
        </div>
    );
}
