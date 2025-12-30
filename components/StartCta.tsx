"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StartCta() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check for token on mount
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    const handleClick = () => {
        if (isLoggedIn) {
            router.push("/prompt-builder");
        } else {
            router.push("/register");
        }
    };

    return (
        <Button
            size="lg"
            onClick={handleClick}
            className="h-14 px-10 text-lg bg-white text-black hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] rounded-full border-4 border-transparent hover:border-blue-100 group"
        >
            Start Building Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
    );
}
