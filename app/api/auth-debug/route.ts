import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function GET() {
    const steps = [];
    try {
        steps.push("Checking MONGODB_URI: " + (process.env.MONGODB_URI ? "Defined (" + process.env.MONGODB_URI.substring(0, 15) + "...)" : "MISSING"));
        steps.push("Checking JWT_SECRET: " + (process.env.JWT_SECRET ? "Defined" : "MISSING (using default)"));
        
        steps.push("Connecting DB...");
        await dbConnect();
        steps.push("DB Connected");

        steps.push("Hashing Password (bcrypt)...");
        await hashPassword("test");
        steps.push("Password Hashed");

        steps.push("Checking User Model...");
        const count = await User.countDocuments();
        steps.push("User Count: " + count);

        return NextResponse.json({ success: true, steps });
    } catch (e: any) {
        return NextResponse.json({ success: false, steps, error: e.toString(), stack: e.stack }, { status: 500 });
    }
}
