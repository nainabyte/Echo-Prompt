import { NextResponse } from "next/server";
import { generateWithGeminiFlash, generateWithGroq, generateWithHF } from "@/lib/ai-clients";

// We will use a streaming approach or just wait for all?
// "Execute in parallel. Do not fail if one model fails"
// We return a JSON with all results.

export async function POST(req: Request) {
    const { prompt } = await req.json();

    if (!prompt) {
        return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Define the models to call
    const jobs = [
        { name: "Gemini Flash", fn: () => generateWithGeminiFlash(prompt) },
        // Groq Models
        { name: "Groq LLaMA 3.1", fn: () => generateWithGroq(prompt, "llama3-8b-8192") },
        { name: "Groq Mixtral", fn: () => generateWithGroq(prompt, "mixtral-8x7b-32768") },
        // HF Models (Zephyr, Flan-T5, Mixtral)
        { name: "HF Mixtral", fn: () => generateWithHF(prompt, "mixtral") },
        { name: "HF Flan-T5", fn: () => generateWithHF(prompt, "flan-t5") },
        { name: "HF Zephyr", fn: () => generateWithHF(prompt, "zephyr") },
    ];

    const results = await Promise.allSettled(
        jobs.map(async (job) => {
            const start = Date.now();
            try {
                const text = await job.fn();
                const duration = Date.now() - start;
                return { name: job.name, status: "success", text, duration };
            } catch (e: any) {
                const duration = Date.now() - start;
                return { name: job.name, status: "error", error: e.message, duration };
            }
        })
    );

    // internal Promise.allSettled returns objects with { status: 'fulfilled', value: ... }
    // We want to map it to our result structure
    const finalOutput = results.map((res) => {
        if (res.status === "fulfilled") return res.value;
        // This case shouldn't be reached because we catch inside the map, 
        // but just in case of crash in wrapper
        return { name: "Unknown", status: "error", error: "System crash", duration: 0 };
    });

    return NextResponse.json({ results: finalOutput });
}
