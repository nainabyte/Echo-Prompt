import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
    // Define protected paths
    const protectedPaths = ["/dashboard", "/prompt-builder", "/history", "/templates"];

    const isProtected = protectedPaths.some((path) =>
        req.nextUrl.pathname.startsWith(path)
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    // Check for Authorization header
    // Check for Authorization header
    const authHeader = req.headers.get("authorization");

    // Also check cookie (primary for navigation protection)
    let token = authHeader?.split(" ")[1];

    if (!token) {
        const cookie = req.cookies.get("auth-token");
        token = cookie?.value;
    }

    if (!token) {
        // Redirect to login if no token
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/prompt-builder/:path*", "/history/:path*", "/templates/:path*"],
};
