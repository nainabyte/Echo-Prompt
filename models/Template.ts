import mongoose from "mongoose";

const TemplateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    historyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "History",
    },
    inputs: {
        role: String,
        task: String,
        context: String,
        tone: String,
        outputFormat: String,
        temperature: Number,
        maxTokens: Number,
    },
    generatedPrompt: String,
    testInput: String,
    evaluation: {
        score: Number,
        issues: [String],
        suggestions: [String],
    },
    results: [
        {
            name: String,
            status: String,
            text: String,
            error: String,
            duration: Number,
            isFavorite: { type: Boolean, default: false },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Template || mongoose.model("Template", TemplateSchema);
