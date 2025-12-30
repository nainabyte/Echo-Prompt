"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // Auto-login logic
            if (data.token && data.user) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // Force a small delay or event dispatch could be useful, 
                // but direct push usually works if Navbar checks localstorage/cookie on mount/route change.
                router.push("/prompt-builder");
                router.refresh(); // Ensure strict auth checks re-run
            } else {
                // Fallback for some reason
                router.push("/login");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>Create a new account for EchoPrompt.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Creating Account..." : "Register"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
