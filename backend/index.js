import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { DBConnection } from "./database/db.js";
import User from "./model/User.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB Atlas
DBConnection().catch(err => {
    console.error("Failed to connect to MongoDB Atlas:", err);
    process.exit(1);
});

// Health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({ message: "AlgoU Auth Server is running!", status: "healthy" });
});

// Register endpoint
app.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        if (!(firstname && lastname && email && password)) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ firstname: firstname.trim(), lastname: lastname.trim(), email: email.toLowerCase().trim(), password: hashedPassword });
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "24h" });
        res.status(201).json({ success: true, user: { _id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email, createdAt: user.createdAt }, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error during registration" });
    }
});

// Login endpoint
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!(email && password)) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: "24h" });
        res.status(200).json({ success: true, user: { _id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email }, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error during login" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the server at: http://localhost:${PORT}`);
});
