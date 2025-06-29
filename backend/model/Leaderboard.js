import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    unique: true
  },

  rating: {
    type: Number,
    default: 1500,
    min: [0, "Rating cannot be negative"]
  },

  // Unified badge field (acts as tier too)
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

  solved: {
    type: Number,
    default: 0,
    min: [0, "Solved count cannot be negative"]
  },

  contests: {
    type: Number,
    default: 0,
    min: [0, "Contest count cannot be negative"]
  },

  winRate: {
    type: Number,
    default: 0,
    min: [0, "Win rate cannot be negative"],
    max: [100, "Win rate cannot exceed 100"]
  },

  country: {
    type: String,
    default: "Unknown",
    trim: true
  },

  recentActivity: [{
    type: Number,
    min: [1, "Position must be at least 1"]
  }],

  rank: {
    type: Number,
    default: 0,
    min: [0, "Rank cannot be negative"]
  }

}, {
  timestamps: true
});

// Indexes for optimization
leaderboardSchema.index({ rating: -1 });
leaderboardSchema.index({ solved: -1 });
leaderboardSchema.index({ badge: 1 });
leaderboardSchema.index({ country: 1, rating: -1 });

export default mongoose.model("Leaderboard", leaderboardSchema);
