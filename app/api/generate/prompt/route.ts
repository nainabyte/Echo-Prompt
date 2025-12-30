import { NextResponse } from "next/server";
import { generateWithGeminiFlash } from "@/lib/ai-clients";
import { generateFallbackPrompt } from "@/lib/fallback-generator";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

// Helper to get user from request (duplicated for now, could be shared)
async function getUser(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return null;
    return await verifyToken(token);
}

export async function POST(req: Request) {
    let inputs;

    // 1. Authenticate & Usage Check
    let user = null;
    let userId = null;
    let remainingRequests = 0;

    try {
        const payload = await getUser(req);
        // We allow anonymous usage for now? Or enforce login?
        // Let's enforce login for specific features, but maybe optional here?
        // The plan implied getting user from session.
        // For now, if no user, we might mock it or require it. 
        // Let's try to find the user if token exists.

        if (payload) {
            await dbConnect();
            user = await User.findById(payload.userId);
            userId = payload.userId;

            if (user) {
                // Check quota
                const now = new Date();
                const lastDate = new Date(user.lastRequestDate);

                // Reset if different day
                if (now.getDate() !== lastDate.getDate() || now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear()) {
                    user.requestCount = 0;
                    user.lastRequestDate = now;
                }

                if (user.requestCount >= user.quotaLimit) {
                    return NextResponse.json({
                        error: "Daily quota exceeded",
                        usage: { current: user.requestCount, limit: user.quotaLimit }
                    }, { status: 429 });
                }
            }
        }

    } catch (e) {
        console.error("Auth/DB Error:", e);
        // Continue but maybe without tracking? Or fail safe?
    }

    try {
        const body = await req.json();
        inputs = body.inputs;
        const evaluation = body.evaluation;
        const style = body.style;

        if (!inputs) {
            return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
        }

        // Construct the meta-prompt for Gemini
        const metaPrompt = `
    You are an expert Prompt Engineer.
    Your goal is to transform the user's raw inputs into a highly optimized, structured prompt for an LLM.
    
    USER INPUTS:
    - Role: ${inputs.role || "Not specified"}
    - Task: ${inputs.task}
    - Context: ${inputs.context || "Not specified"}
    - Tone: ${inputs.tone || "Not specified"}
    - Output Format: ${inputs.outputFormat || "Not specified"}
    
    SYSTEM EVALUATION FEEDBACK (Address these issues):
    ${evaluation?.suggestions?.map((s: string) => `- ${s}`).join('\n') || "None"}
    
    STYLE: ${style || "Standard"}
    
    REQUIRED OUTPUT FORMAT:
    ROLE:
    [Defined Persona]
    
    TASK:
    [Clear instruction]
    
    CONTEXT & CONSTRAINTS:
    [Contextual details]
    
    OUTPUT REQUIREMENTS:
    [Format and Tone]
    
    Generate ONLY the optimization prompt. Do not add conversational text.
    `;

        const generatedPrompt = await generateWithGeminiFlash(metaPrompt);

        // Update Usage if success
        let usageData = null;
        if (user) {
            user.requestCount += 1;
            user.lastRequestDate = new Date();
            await user.save();
            usageData = { current: user.requestCount, limit: user.quotaLimit };
        }

        return NextResponse.json({
            prompt: generatedPrompt,
            usage: usageData
        });
    } catch (error: any) {
        console.error("Prompt Generation Error (Using Fallback):", error);

        // Fallback Logic
        if (inputs) {
            const fallbackPrompt = generateFallbackPrompt(inputs);

            // Even fallback might count towards usage if we want to be strict, 
            // but usually fallback is free since it doesn't cost API credits.
            // Let's NOT count fallback towards quota.

            let usageData = null;
            if (user) {
                usageData = { current: user.requestCount, limit: user.quotaLimit };
            }

            return NextResponse.json({
                prompt: fallbackPrompt,
                isFallback: true,
                usage: usageData
            });
        }

        return NextResponse.json({ error: error.message || "Failed to generate prompt" }, { status: 500 });
    }
}
