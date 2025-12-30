import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing email or password" },
                { status: 400 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const token = await signToken({ userId: user._id.toString(), email: user.email });

        // Set cookie for middleware access (essential for App Router protection)
        const response = NextResponse.json(
            { token, user: { username: user.username, email: user.email } },
            { status: 200 }
        );

        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            path: "/",
            maxAge: 86400 // 1 day
        });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
