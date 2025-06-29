import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    // Who submitted
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },

    // Problem on which code was submitted
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: [true, "Problem reference is required"]
    },

    // Language used
    language: {
        type: String,
        required: [true, "Programming language is required"],
        enum: {
            values: ["cpp", "java", "python", "javascript"],
            message: "Language must be one of: cpp, java, python, javascript"
        }
    },

    // Submitted code
    code: {
        type: String,
        required: [true, "Code submission is required"],
        trim: true
    },

    // Status of the submission
    status: {
        type: String,
        required: true,
        enum: {
            values: [
                "pending",
                "running",
                "accepted",
                "wrong_answer",
                "time_limit_exceeded",
                "memory_limit_exceeded",
                "compilation_error",
                "runtime_error"
            ],
            message: "Invalid submission status"
        },
        default: "pending"
    },

    // Performance metrics
    executionTime: {
        type: Number, // in milliseconds
        min: [0, "Execution time cannot be negative"]
    },

    memoryUsed: {
        type: Number, // in MB
        min: [0, "Memory usage cannot be negative"]
    },

    // Test case results
    testCasesPassed: {
        type: Number,
        default: 0
    },

    totalTestCases: {
        type: Number,
        default: 0
    },

    // Error details if any
    errorMessage: {
        type: String,
        trim: true,
        default: ""
    },

    // Score (for contests or partial scoring)
    score: {
        type: Number,
        default: 0,
        min: [0, "Score cannot be negative"]
    },

    isContestSubmission: {
        type: Boolean,
        default: false
    },
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        default: null,
        validate: {
            validator: function (val) {
                // contest field should only be present if isContestSubmission is true
                return this.isContestSubmission ? !!val : val === null;
            },
            message: "Contest field should only be set if 'isContestSubmission' is true"
        }
    },

    // Per-test-case results for detailed analysis
    testCaseResults: [
        {
            input: { type: String },
            expectedOutput: { type: String },
            userOutput: { type: String },
            isCorrect: { type: Boolean },
            error: { type: String, default: "" }
        }
    ]
}, {
    timestamps: true
});

// ✅ Indexes for performance
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ createdAt: -1 });
submissionSchema.index({ user: 1, status: 1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ user: 1, contest: 1 });
submissionSchema.index({ user: 1, contest: 1, problem: 1 });

export default mongoose.model("Submission", submissionSchema);
