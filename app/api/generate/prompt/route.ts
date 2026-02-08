import { NextResponse } from "next/server";
import { generateWithGeminiFlash } from "@/lib/ai-clients";
import { generateFallbackPrompt } from "@/lib/fallback-generator";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilarChunks } from "@/lib/mongodb-vector";
import { formatContextForPrompt } from "@/lib/context-retrieval";

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
    let user: any = null;
    let userId: string | null = null;
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
            userId = payload.userId as string;

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
        const enableRAG = body.enableRAG;
        const selectedDocIds = body.selectedDocIds;

        if (!inputs) {
            return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
        }

        // 2. RAG Context Retrieval (Optional)
        let retrievedContext = "";
        if (enableRAG && userId) {
            try {
                // Use the task as the query for RAG
                const queryText = inputs?.task || "";
                const queryEmbedding = await generateEmbedding(queryText);
                const results = await searchSimilarChunks(
                    userId as string,
                    queryEmbedding,
                    5, // Top 5 relevant chunks
                    selectedDocIds // Filter by selected documents if provided
                );

                if (results && results.length > 0) {
                    retrievedContext = formatContextForPrompt(results);
                }
            } catch (ragError) {
                console.error("RAG Retrieval Error:", ragError);
                // Continue without context if RAG fails
            }
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
    
    ${retrievedContext ? `GROUNDING CONTEXT:
    The following information was retrieved from the user's uploaded documents. 
    Use this knowledge to GROUND the optimized prompt and ensure it respects the provided context.
    
    ${retrievedContext}` : ""}
    
    REQUIRED OUTPUT FORMAT:
    ROLE:
    [Defined Persona]
    
    TASK:
    [Clear instruction]
    
    CONTEXT & CONSTRAINTS:
    [Contextual details - INGEST RETRIEVED KNOWLEDGE HERE IF APPLICABLE]
    
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
