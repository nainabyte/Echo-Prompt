import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await dbConnect();

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or username already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        // Generate token for immediate login
        const token = await signToken({ userId: newUser._id.toString(), email: newUser.email });

        // Create response with token and cookie
        const response = NextResponse.json(
            {
                message: "User created successfully",
                token,
                user: { username: newUser.username, email: newUser.email }
            },
            { status: 201 }
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
        console.error("Registration Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
