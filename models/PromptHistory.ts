import mongoose from "mongoose";

const PromptHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        default: "Untitled Prompt",
    },
    originalPrompt: {
        type: String,
        required: true,
    },
    optimizedPrompt: {
        type: String,
    },
    versions: [
        {
            label: { type: String, default: "v1" },
            content: { type: String, required: true },
            score: { type: Number, default: 0 },
            timestamp: { type: Date, default: Date.now },
            comments: String
        }
    ],
    responses: [
        {
            model: { type: String, required: true },
            text: { type: String, required: true },
            cost: { type: Number, default: 0 }, // Estimated cost in USD
            duration: { type: Number, default: 0 }, // Execution time in ms
            timestamp: { type: Date, default: Date.now },
            isFavorite: { type: Boolean, default: false },
            rating: { type: Number, min: 0, max: 5, default: 0 },
            evaluation: {
                isValidJson: { type: Boolean, default: true },
                score: { type: Number, default: 0 },
                feedback: [String],
                keywordsFound: [String]
            }
        }
    ],
    tags: [String],
    isFavorite: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

// Ensure virtuals are included in JSON
PromptHistorySchema.set('toJSON', { virtuals: true });
PromptHistorySchema.set('toObject', { virtuals: true });

export default mongoose.models.PromptHistory || mongoose.model("PromptHistory", PromptHistorySchema);
