import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true
    },
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    isSample: {
      type: Boolean,
      default: false
    },
    index: {
      type: Number,
      required: true
    }
  }, { timestamps: true });

export default mongoose.model("TestCase", testCaseSchema);