import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    // Problem title
    name: {
        type: String,
        required: [true, "Problem name is required"],
        trim: true,
        minlength: [3, "Problem name must be at least 3 characters long"],
        maxlength: [100, "Problem name cannot exceed 100 characters"]
    },

    // Problem description
    statement: {
        type: String,
        required: [true, "Problem statement is required"],
        trim: true,
        minlength: [10, "Problem statement must be at least 10 characters long"]
    },

    // Unique short code like "SUM1", "ABC123"
    code: {
        type: String,
        required: [true, "Problem code is required"],
        unique: true,
        trim: true,
        match: [
            /^[A-Z0-9]{3,10}$/,
            "Problem code must be 3-10 characters long and contain only uppercase letters and numbers"
        ]
    },

    // Difficulty level
    difficulty: {
        type: String,
        required: [true, "Difficulty level is required"],
        enum: {
            values: ["easy", "medium", "hard"],
            message: "Difficulty must be either easy, medium, or hard"
        },
        lowercase: true,
        trim: true
    },

    // Problem tags like ["dp", "binary search"]
    tags: {
        type: [String],
        required: [true, "At least one tag is required"],
        validate: {
            validator: function(tags) {
                return tags.length > 0 && tags.every(tag => tag.trim().length > 0);
            },
            message: "Tags cannot be empty"
        }
    },

    // Time and memory limits
    timeLimit: {
        type: Number,
        required: [true, "Time limit is required"],
        min: [100, "Time limit must be at least 100ms"],
        max: [10000, "Time limit cannot exceed 10000ms"]
    },
    memoryLimit: {
        type: Number,
        required: [true, "Memory limit is required"],
        min: [1, "Memory limit must be at least 1MB"],
        max: [512, "Memory limit cannot exceed 512MB"]
    },

    // Reference to the problem creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Problem creator reference is required"]
    },

    // Inline sample test cases
    samples: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true },
            explanation: { type: String, default: "" }
        }
    ],

    // Optional constraints / formatting
    inputFormat: {
        type: String,
        default: ""
    },
    outputFormat: {
        type: String,
        default: ""
    },
    constraints: {
        type: String,
        default: ""
    },

    // Statistics
    totalSubmissions: {
        type: Number,
        default: 0
    },
    totalAccepted: {
        type: Number,
        default: 0
    },

    // Publish control
    isPublished: {
        type: Boolean,
        default: false
    },

    // Editorial content or article link
    editorial: {
        type: String,
        default: ""
    }

    // Timestamps (createdAt, updatedAt)
}, {
    timestamps: true
});

export default mongoose.model("Problem", problemSchema);