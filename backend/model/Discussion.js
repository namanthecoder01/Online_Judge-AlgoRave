import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: [5, "Content must be at least 5 characters long"]
    }
}, {
    timestamps: true
});

export default mongoose.model("Discussion", discussionSchema); 