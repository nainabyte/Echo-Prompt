import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: String,
    inputs: {
        role: String,
        task: String,
        context: String,
        tone: String,
        outputFormat: String,
    },
    evaluation: {
        score: Number,
        issues: [String],
        suggestions: [String],
    },
    generatedPrompt: String,
    versions: [
        {
            label: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    testInput: String,
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
    favorite: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.History || mongoose.model("History", HistorySchema);
