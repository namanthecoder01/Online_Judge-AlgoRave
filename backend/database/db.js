import mongoose from "mongoose";
import { config } from "../config.js";

const DBConnection = async () => {
    // MongoDB connection string
    const MONGO_URI = config.MONGODB_URI;
    
    if (!MONGO_URI) {
        console.error("MONGODB_URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        process.exit(1);
    }
};

// Export the connection function for use in other modules
export { DBConnection };