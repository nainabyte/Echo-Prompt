"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTemplates = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await fetch("/api/templates", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch templates");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleLoadTemplate = (template: any) => {
        router.push(`/prompt-builder?loadId=${template._id}&source=templates`);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this template?")) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`/api/templates?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setTemplates((prev) => prev.filter((item) => item._id !== id));
            } else {
                alert("Failed to delete template.");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 min-h-screen">
            <h1 className="text-3xl font-bold tracking-tight text-gradient mb-6">Templates</h1>

            {templates.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground mb-4">No templates saved yet.</p>
                    <Button variant="outline" onClick={() => router.push('/prompt-builder')}>Create One</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((item) => (
                        <Card key={item._id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => handleLoadTemplate(item)}>
                            <CardHeader>
                                <CardTitle className="group-hover:text-primary transition-colors">{item.name}</CardTitle>
                                <CardDescription>
                                    {item.inputs.role || "General"} | {item.inputs.tone || "Neutral"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground h-24 overflow-hidden relative">
                                {item.inputs.task}
                                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent" />
                            </CardContent>
                            <CardFooter>
                                <div className="flex gap-2 w-full">
                                    <Button className="flex-1 group-hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); handleLoadTemplate(item); }}>
                                        Load Template <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10 shrink-0" onClick={(e) => handleDelete(item._id, e)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
