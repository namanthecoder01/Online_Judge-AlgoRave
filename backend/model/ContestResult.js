import mongoose from "mongoose";

const contestResultSchema = new mongoose.Schema({
    // Reference to the user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },

    // Reference to the contest
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: [true, "Contest reference is required"]
    },

    // Number of problems solved in the contest
    problemsSolved: {
        type: Number,
        default: 0,
        min: [0, "Problems solved cannot be negative"]
    },

    // Total number of problems in the contest
    totalProblems: {
        type: Number,
        required: [true, "Total problems count is required"],
        min: [1, "Total problems must be at least 1"]
    },

    // Total score accumulated
    score: {
        type: Number,
        default: 0,
        min: [0, "Score cannot be negative"]
    },

    // Final rank of the user in the contest
    rank: {
        type: Number,
        min: [1, "Rank must be at least 1"]
    },

    // Total time taken in minutes
    timeTaken: {
        type: Number,
        min: [0, "Time taken cannot be negative"]
    },

    // Array of individual problem submissions
    submissions: [
        {
            problem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem"
            },
            status: {
                type: String,
                enum: [
                    "accepted",
                    "wrong_answer",
                    "time_limit_exceeded",
                    "memory_limit_exceeded",
                    "compilation_error",
                    "runtime_error"
                ]
            },
            submissionTime: {
                type: Date
            },
            attempts: {
                type: Number,
                default: 1,
                min: [1, "Attempts must be at least 1"]
            }
        }
    ],
}, {
    timestamps: true
});
// Ensure uniqueness of contest entry per user
contestResultSchema.index({ user: 1, contest: 1 }, { unique: true });

// Fast sorting for leaderboard generation
contestResultSchema.index({ contest: 1, rank: 1 });
contestResultSchema.index({ contest: 1, score: -1, timeTaken: 1 }); // Optional for tie-breakers
contestResultSchema.index({ user: 1, createdAt: -1 }); // User history

export default mongoose.model("ContestResult", contestResultSchema);
