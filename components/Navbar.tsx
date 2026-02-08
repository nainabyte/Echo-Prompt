"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Simple check for token
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, [pathname]); // re-check on route change

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        setIsAuthenticated(false);
        router.push("/login");
    };

    // Don't show navbar on auth pages effectively
    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    return (
        <header className="px-4 lg:px-6 h-16 flex items-center glass sticky top-0 z-50">
            <Link className="flex items-center justify-center font-bold text-xl tracking-tighter gap-3 hover:opacity-80 transition-opacity group" href="/">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300">
                    <Image
                        src="/logo.png"
                        alt="EchoPrompt Logo"
                        fill
                        className="object-cover"
                    />
                </div>
                <span className="text-gradient">EchoPrompt</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                {isAuthenticated ? (
                    <>
                        <Link className={`text-sm font-medium hover:text-primary transition-colors ${pathname === '/prompt-builder' ? 'text-blue-400' : ''}`} href="/prompt-builder">
                            Builder
                        </Link>
                        <Link className={`text-sm font-medium hover:text-primary transition-colors ${pathname === '/prompts' ? 'text-blue-400' : ''}`} href="/prompts">
                            Library
                        </Link>
                        <Link className={`text-sm font-medium hover:text-primary transition-colors ${pathname === '/history' ? 'text-blue-400' : ''}`} href="/history">
                            History
                        </Link>
                        <Link className={`text-sm font-medium hover:text-primary transition-colors ${pathname === '/templates' ? 'text-blue-400' : ''}`} href="/templates">
                            Templates
                        </Link>
                        <Link className={`text-sm font-medium hover:text-primary transition-colors ${pathname === '/analytics' ? 'text-blue-400' : ''}`} href="/analytics">
                            Analytics
                        </Link>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-red-500/10 hover:text-red-400">
                            Logout
                        </Button>
                    </>
                ) : (
                    <>
                        <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
                            Login
                        </Link>
                        <Link className="text-sm font-medium hover:text-primary transition-colors" href="/register">
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
