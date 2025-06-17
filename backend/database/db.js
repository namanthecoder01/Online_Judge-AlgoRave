import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DBConnection = async () => {
    // MongoDB Atlas connection string
    const MONGO_URI = process.env.MONGODB_URI;
    
    if (!MONGO_URI) {
        console.error("MONGODB_URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Successfully connected to MongoDB Atlas");
    } catch (error) {
        console.error("Failed to connect to MongoDB Atlas:", error.message);
        process.exit(1);
    }
};

// Export the connection function for use in other modules
export { DBConnection };