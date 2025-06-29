import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
    // Title of the contest
    title: {
        type: String,
        required: [true, "Contest title is required"],
        trim: true,
        minlength: [3, "Contest title must be at least 3 characters long"],
        maxlength: [100, "Contest title cannot exceed 100 characters"]
    },

    // Full description of the contest
    description: {
        type: String,
        required: [true, "Contest description is required"],
        trim: true,
        minlength: [10, "Contest description must be at least 10 characters long"]
    },

    // Start time in UTC
    startTime: {
        type: Date,
        required: [true, "Start time is required"]
    },

    // Duration in minutes for easier calculations
    durationMinutes: {
        type: Number,
        required: [true, "Duration is required"],
        min: [10, "Duration must be at least 10 minutes"]
    },

    // Difficulty (intended audience level)
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

    // Contest format or category (e.g., 'rated', 'practice')
    type: {
        type: String,
        required: [true, "Contest type is required"],
        enum: ["rated", "practice"],
        default: "practice"
    },

    // Number of people currently registered
    participants: {
        type: Number,
        default: 0,
        min: [0, "Participants cannot be negative"]
    },

    // List of prize names or rewards
    prizes: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
                return arr.length > 0 && arr.every(prize => prize.trim().length > 0);
            },
            message: "Prizes cannot be empty"
        }
    },

    // Status updated dynamically
    status: {
        type: String,
        required: true,
        enum: ["upcoming", "ongoing", "past"],
        default: "upcoming"
    },

    // Registered users for the contest
    registeredUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    // Problems included in the contest
    problems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem"
        }
    ],

    // Creator/host of the contest
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

// Indexes for fast filtering/sorting
contestSchema.index({ startTime: 1 });
contestSchema.index({ status: 1 });
contestSchema.index({ createdBy: 1 });

export default mongoose.model("Contest", contestSchema);