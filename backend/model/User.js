import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [30, "Username cannot exceed 30 characters"],
        match: [
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        ]
    },
    firstname: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [50, "First name cannot exceed 50 characters"]
    },
    lastname: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    bio: {
        type: String,
        maxlength: [300, "Bio cannot exceed 300 characters"],
        default: ""
    },
    college: {
        type: String,
        maxlength: [100, "College name cannot exceed 100 characters"],
        default: ""
    },
    country: {
        type: String,
        maxlength: [56, "Country name cannot exceed 56 characters"],
        default: ""
    },
    preferredLanguages: {
        type: [String],
        default: []
    },
    badge: {
        type: String,
        enum: [
            "Code Novice",
            "Algorithm Ace",
            "Problem Slayer",
            "Contest Conqueror",
            "Grandmaster Coder"
        ],
        default: "Code Novice"
    },
    problemsSolved: {
        type: Number,
        default: 0
    },
    ranking: {
        type: Number,
        default: 0
    },
    totalSubmissions: {
        type: Number,
        default: 0
    },
    correctSubmissions: {
        type: Number,
        default: 0
    },
    solvedProblems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem"
        }
    ],
    contestsParticipated: [
        {
            contestId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Contest"
            },
            rank: Number,
            score: Number,
            totalProblems: Number,
            attemptedProblems: Number,
            correctProblems: Number,
            timeTaken: Number // in seconds or minutes
        }
    ],
    problemsByTag: {
        type: Map,
        of: Number,
        default: {}
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save middleware to ensure problemsByTag is always a Map
userSchema.pre('save', function(next) {
    if (!(this.problemsByTag instanceof Map)) {
        this.problemsByTag = new Map(Object.entries(this.problemsByTag || {}));
    }
    next();
});

export default mongoose.model("User", userSchema);