import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { createRequire } from "module";
import axios from "axios";

// Remote compiler-backend URL (can be set via env variable)
const COMPILER_BACKEND_URL = process.env.COMPILER_BACKEND_URL || "https://online-judge-algorave-2.onrender.com";

// Database and configuration imports
import { DBConnection } from "./database/db.js";
import { config } from "./config.js";

// Model imports
import TestCase from "./model/TestCase.js";
import User from "./model/User.js";
import Problem from "./model/Problem.js";
import Contest from "./model/Contest.js";
import Leaderboard from "./model/Leaderboard.js";
import Submission from "./model/Submission.js";
import ContestResult from "./model/ContestResult.js";
import Discussion from "./model/Discussion.js";

// Service imports
import { getLeaderboard, getUserLeaderboardStats, updateLeaderboardOnContestEnd } from "./services/leaderboardService.js";

// Middleware imports
import adminMiddleware from './middleware/admin.js';
import authMiddleware from './middleware/auth.js';

const app = express();
// const PORT = config.PORT; // Removed - using serverPort instead

// CORS configuration
const allowedOrigins = [
    'https://algorave.me', 
    'https://online-judge-algo-rave.vercel.app',
    'https://online-judge-algorave-2.onrender.com', 
    'http://localhost:3000'
];

// Add any additional origins from environment variable
if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
    allowedOrigins.push(...additionalOrigins);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB
DBConnection().catch(err => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
});

// Health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({ message: "AlgoRave Server is running!", status: "healthy" });
});

// Register endpoint
app.post("/register", async (req, res) => {
    try {
        const { username, firstname, lastname, email, password } = req.body;
        if (!(username && firstname && lastname && email && password)) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with this email or username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ 
            username: username.trim(), 
            firstname: firstname.trim(), 
            lastname: lastname.trim(), 
            email: email.toLowerCase().trim(), 
            password: hashedPassword 
        });

        console.log(`[Register] User ${user.username} created successfully. ID: ${user._id}`);
        
        // Initialize leaderboard entry for the new user
        try {
            await getUserLeaderboardStats(user._id);
            console.log(`[Register] Leaderboard entry created successfully for user: ${user.username}`);
        } catch (leaderboardError) {
            console.error(`[Register] CRITICAL: Failed to create leaderboard entry for ${user.username}. Error:`, leaderboardError);
            // We don't want to fail the registration, but we must log this failure.
        }

        const token = jwt.sign({ id: user._id, email: user.email }, config.SECRET_KEY, { expiresIn: "24h" });
        res.status(201).json({ success: true, user: { _id: user._id, username: user.username, firstname: user.firstname, lastname: user.lastname, email: user.email, createdAt: user.createdAt }, token });
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
        const token = jwt.sign({ id: user._id, email: user.email }, config.SECRET_KEY, { expiresIn: "24h" });
        res.status(200).json({ success: true, user, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error during login" });
    }
});

// Logout endpoint
app.post("/logout", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error during logout" });
    }
});

// Get all problems endpoint
app.get("/api/problems", async (req, res) => {
    try {
        const problems = await Problem.find({ isPublished: true })
            .select('-statement')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, problems });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching problems" });
    }
});

// Get single problem endpoint
app.get("/api/problems/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate('createdBy', 'firstname lastname');
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        res.status(200).json({ success: true, problem });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching problem" });
    }
});

// Get all contests endpoint
app.get("/api/contests", async (req, res) => {
    try {
        const contests = await Contest.find({})
            .populate('createdBy', 'firstname lastname')
            .sort({ startTime: 1 });
        res.status(200).json({ success: true, contests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching contests" });
    }
});

// Get contests by status endpoint
app.get("/api/contests/status/:status", async (req, res) => {
    try {
        const { status } = req.params;
        const contests = await Contest.find({ status })
            .populate('createdBy', 'firstname lastname')
            .sort({ startTime: 1 });
        res.status(200).json({ success: true, contests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching contests" });
    }
});

// Get single contest endpoint
app.get("/api/contests/:id", async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate('createdBy', 'firstname lastname')
            .populate('problems', 'name code difficulty');
        if (!contest) {
            return res.status(404).json({ success: false, message: "Contest not found" });
        }
        res.status(200).json({ success: true, contest });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching contest" });
    }
});

// Register for contest endpoint
app.post("/api/contests/:id/register", async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;

        const contest = await Contest.findById(id);
        if (!contest) {
            return res.status(404).json({ success: false, message: "Contest not found" });
        }

        if (contest.registeredUsers.includes(userId)) {
            return res.status(400).json({ success: false, message: "Already registered for this contest" });
        }

        contest.registeredUsers.push(userId);
        contest.participants = contest.registeredUsers.length;
        await contest.save();

        res.status(200).json({ success: true, message: "Successfully registered for contest" });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error registering for contest" });
    }
});

// Unregister from contest endpoint
app.post("/api/contests/:id/unregister", async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;

        const contest = await Contest.findById(id);
        if (!contest) {
            return res.status(404).json({ success: false, message: "Contest not found" });
        }

        if (!contest.registeredUsers.includes(userId)) {
            return res.status(400).json({ success: false, message: "Not registered for this contest" });
        }

        contest.registeredUsers = contest.registeredUsers.filter(user => user.toString() !== userId);
        contest.participants = contest.registeredUsers.length;
        await contest.save();

        res.status(200).json({ success: true, message: "Successfully unregistered from contest" });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error unregistering from contest" });
    }
});

// Get user's registered contests
app.get("/api/user/contests", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;

        const contests = await Contest.find({ registeredUsers: userId })
            .populate('createdBy', 'firstname lastname')
            .sort({ startTime: 1 });

        res.status(200).json({ success: true, contests });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching user contests" });
    }
});

// Get leaderboard endpoint
app.get("/api/leaderboard", async (req, res) => {
    try {
        const { sortBy = 'rating', limit = 50 } = req.query;
        
        // Query is now empty, as all filtering will be done client-side.
        const query = {};
        const leaderboard = await getLeaderboard(query, sortBy, parseInt(limit));
        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching leaderboard" });
    }
});

// Get single user leaderboard stats
app.get("/api/leaderboard/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userStats = await Leaderboard.findOne({ user: userId })
            .populate('user', 'firstname lastname email');
        
        if (!userStats) {
            return res.status(404).json({ success: false, message: "User stats not found" });
        }
        
        res.status(200).json({ success: true, userStats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching user stats" });
    }
});

// Update user leaderboard stats (for admin or system use)
app.put("/api/leaderboard/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { rating, solved, contests, winRate, country, badge, recentActivity } = req.body;
        
        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (solved !== undefined) updateData.solved = solved;
        if (contests !== undefined) updateData.contests = contests;
        if (winRate !== undefined) updateData.winRate = winRate;
        if (country !== undefined) updateData.country = country;
        if (badge !== undefined) updateData.badge = badge;
        if (recentActivity !== undefined) updateData.recentActivity = recentActivity;
        
        const userStats = await Leaderboard.findOneAndUpdate(
            { user: userId },
            updateData,
            { new: true, upsert: true }
        ).populate('user', 'firstname lastname email');
        
        res.status(200).json({ success: true, userStats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating user stats" });
    }
});

// Get current user's profile
app.get("/api/user/profile", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching user profile" });
    }
});

// Update current user's profile
app.put("/api/user/profile", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        let { bio, college, country, preferredLanguages, badge, problemsSolved } = req.body;
        // Ensure preferredLanguages is always an array
        if (typeof preferredLanguages === 'string') {
            preferredLanguages = preferredLanguages.split(',').map(l => l.trim()).filter(Boolean);
        }
        const updateFields = { bio, college, country, preferredLanguages, badge, problemsSolved };
        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error updating user profile" });
    }
});

// Get user submissions
app.get("/api/user/submissions", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        
        const submissions = await Submission.find({ user: userId })
            .populate('problem', 'name code difficulty')
            .populate('contest', 'title')
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.status(200).json({ success: true, submissions });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching submissions" });
    }
});

// Helper function to execute code based on language (calls remote compiler-backend)
const executeCode = async (language, filePath, input, timeLimit, memoryLimit) => {
    try {
        console.log(`Executing code: ${language}, filePath: ${filePath}, timeLimit: ${timeLimit}, memoryLimit: ${memoryLimit}`);
        const response = await axios.post(`${COMPILER_BACKEND_URL}/execute`, {
            language,
            filePath,
            input,
            timeLimit,
            memoryLimit
        });
        console.log('Execute response:', response.data);
        return response.data;
    } catch (err) {
        console.error('Execute code error:', err);
        // If the remote server returns an error response
        if (err.response && err.response.data) {
            throw err.response.data;
        }
        throw err;
    }
};

// Helper function to generate file on remote compiler-backend
const generateFileRemote = async (language, code) => {
    try {
        console.log(`Generating file for language: ${language}, code length: ${code.length}`);
        const response = await axios.post(`${COMPILER_BACKEND_URL}/generate-file`, {
            language,
            code
        });
        console.log('Generate file response:', response.data);
        return response.data.filePath; // Assumes remote returns { filePath }
    } catch (err) {
        console.error('Generate file error:', err);
        if (err.response && err.response.data) {
            throw err.response.data;
        }
        throw err;
    }
};

// Helper function to determine overall submission status
const determineStatus = (allPassed, firstErrorStatus) => {
    if (allPassed) return 'accepted';
    
    switch (firstErrorStatus) {
        case 'time_limit_exceeded': return 'time_limit_exceeded';
        case 'memory_limit_exceeded': return 'memory_limit_exceeded';
        case 'compilation_error': return 'compilation_error';
        case 'wrong_answer': return 'wrong_answer';
        default: return 'runtime_error';
    }
};

// Submit solution
app.post("/api/problems/:id/submit", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const { language, code, contestId } = req.body;
        const problemId = req.params.id;
        if (!language || !code) {
            return res.status(400).json({ success: false, message: "Language and code are required" });
        }
        // Fetch all test cases for the problem
        const testCases = await TestCase.find({ problem: problemId }).sort({ index: 1 });
        // Add sample test cases from problem.samples
        let sampleTestCases = [];
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        
        // Validate problem has proper time and memory limits
        if (!problem.timeLimit || !problem.memoryLimit) {
            return res.status(500).json({ success: false, message: "Problem configuration error: missing time or memory limits" });
        }
        
        if (problem.samples && Array.isArray(problem.samples) && problem.samples.length > 0) {
            sampleTestCases = problem.samples.map((s, idx) => ({
                input: s.input,
                output: s.output,
                isSample: true,
                index: -(idx + 1) // negative index to keep samples at the top
            }));
        }
        // Mark all regular test cases as isSample: false
        const allTestCases = [...sampleTestCases, ...testCases.map(tc => ({ ...tc.toObject(), isSample: false }))];
        if (!allTestCases.length) {
            return res.status(400).json({ success: false, message: 'No test cases found for this problem.' });
        }
        // Generate file for user code
        let filePath;
        try {
            filePath = await generateFileRemote(language, code);
        } catch (err) {
            return res.status(500).json({ success: false, message: "Error generating code file." });
        }
        // Run code against each test case
        let allPassed = true;
        let firstError = null;
        let firstErrorStatus = null;
        const testCaseResults = [];
        let maxMemoryUsed = 0;
        let maxExecTime = 0;
        
        for (const tc of allTestCases) {
            let userOutput = "";
            let error = "";
            let testCaseMemory = 0;
            let testCaseExecTime = 0;
            let status = 'accepted';
            try {
                const result = await executeCode(language, filePath, tc.input, problem.timeLimit * 1000, problem.memoryLimit);
                userOutput = result.output;
                testCaseMemory = result.memoryUsed || 0;
                testCaseExecTime = result.execTime || 0;
                userOutput = (userOutput || '').replace(/\r\n/g, '\n').trim();
                maxMemoryUsed = Math.max(maxMemoryUsed, testCaseMemory);
                maxExecTime = Math.max(maxExecTime, testCaseExecTime);
            } catch (err) {
                error = err.error || err.message || String(err);
                testCaseMemory = err.memoryUsed || 0;
                testCaseExecTime = err.execTime || 0;
                status = err.status || 'runtime_error';
                maxMemoryUsed = Math.max(maxMemoryUsed, testCaseMemory);
                maxExecTime = Math.max(maxExecTime, testCaseExecTime);
                allPassed = false;
                
                // Track the first error and its status for overall submission status
                if (!firstError) {
                    firstError = error;
                    firstErrorStatus = status;
                }
            }
            const expected = (tc.output || '').replace(/\r\n/g, '\n').trim();
            const isCorrect = !error && userOutput === expected;
            if (!isCorrect && !error) {
                status = 'wrong_answer';
                allPassed = false;
                if (!firstError) {
                    firstError = 'Wrong answer';
                    firstErrorStatus = 'wrong_answer';
                }
            }
            testCaseResults.push({
                input: tc.input,
                expectedOutput: tc.output,
                userOutput,
                isCorrect,
                error,
                isSample: tc.isSample,
                execTime: testCaseExecTime,
                status: status
            });
        }
        const totalExecutionTime = maxExecTime;
        const finalMemoryUsed = Math.round(maxMemoryUsed / 1024); // Convert KB to MB
        
        // Determine overall submission status based on first error
        let overallStatus = determineStatus(allPassed, firstErrorStatus);
        
        // Save submission with detailed results
        const submission = await Submission.create({
            user: userId,
            problem: problemId,
            language,
            code,
            isContestSubmission: !!contestId,
            contest: contestId || null,
            status: overallStatus,
            testCasesPassed: testCaseResults.filter(tc => tc.isCorrect).length,
            totalTestCases: testCaseResults.length,
            testCaseResults,
            errorMessage: firstError || "",
            score: allPassed ? 100 : 0,
            executionTime: Number(totalExecutionTime).toFixed(2),
            memoryUsed: finalMemoryUsed
        });
        // Update user's solved problems and stats if accepted
        if (overallStatus === 'accepted') {
            const user = await User.findById(userId);
            if (!user.solvedProblems.map(id => id.toString()).includes(problemId.toString())) {
                await User.findByIdAndUpdate(userId, {
                    $addToSet: { solvedProblems: problemId },
                    $inc: { problemsSolved: 1, [`problemsByTag.${problem.difficulty}`]: 1 }
                });
                // Also increment rating by 10 in the leaderboard
                await Leaderboard.findOneAndUpdate(
                    { user: userId },
                    { $inc: { rating: 10, solved: 1 } },
                    { upsert: true }
                );
            }
        }
        res.status(201).json({ success: true, submission, testCaseResults });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error submitting solution" });
    }
});

// Get user contest results
app.get("/api/user/contest-results", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        
        const contestResults = await ContestResult.find({ user: userId })
            .populate('contest', 'title startTime durationMinutes')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, contestResults });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching contest results" });
    }
});

// End contest and update leaderboards
app.post("/api/contests/:id/end", async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;

        const contest = await Contest.findById(id);
        if (!contest) {
            return res.status(404).json({ success: false, message: "Contest not found" });
        }

        // Check if user is contest creator or admin
        if (contest.createdBy.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Only contest creator can end the contest" });
        }

        // Update contest status
        contest.status = 'ended';
        contest.endTime = new Date();
        await contest.save();

        // Update leaderboards for all participants
        await updateLeaderboardOnContestEnd(id);

        res.status(200).json({ success: true, message: "Contest ended successfully" });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error ending contest" });
    }
});

// Get contest results
app.get("/api/contests/:id/results", async (req, res) => {
    try {
        const { id } = req.params;
        
        const contestResults = await ContestResult.find({ contest: id })
            .populate('user', 'firstname lastname username')
            .sort({ score: -1, timeTaken: 1 });
        
        res.status(200).json({ success: true, contestResults });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching contest results" });
    }
});

// Get user statistics
app.get("/api/user/stats", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        
        const user = await User.findById(userId);
        const submissions = await Submission.find({ user: userId });
        const contestResults = await ContestResult.find({ user: userId });
        
        // Get leaderboard stats
        const leaderboardStats = await getUserLeaderboardStats(userId);
        
        // Convert Map to object for frontend
        const problemsByTagObj = {};
        if (user.problemsByTag instanceof Map) {
            user.problemsByTag.forEach((value, key) => {
                problemsByTagObj[key] = value;
            });
        } else if (typeof user.problemsByTag === 'object') {
            Object.assign(problemsByTagObj, user.problemsByTag);
        }
        
        const stats = {
            totalSubmissions: submissions.length,
            correctSubmissions: submissions.filter(s => s.status === 'accepted').length,
            problemsSolved: user.problemsSolved || 0,
            contestsParticipated: contestResults.length,
            averageRank: contestResults.length > 0 
                ? contestResults.reduce((sum, cr) => sum + (cr.rank || 0), 0) / contestResults.length 
                : 0,
            problemsByTag: problemsByTagObj,
            // Add leaderboard stats
            rating: leaderboardStats.rating,
            badge: leaderboardStats.badge,
            winRate: leaderboardStats.winRate,
            recentActivity: leaderboardStats.recentActivity
        };
        
        res.status(200).json({ success: true, stats });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching user statistics" });
    }
});

// Update user statistics (called when user solves problems)
app.put("/api/user/stats", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const { problemsSolved, problemsByTag } = req.body;
        
        const updateData = {};
        if (problemsSolved !== undefined) updateData.problemsSolved = problemsSolved;
        if (problemsByTag !== undefined) updateData.problemsByTag = problemsByTag;
        
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        
        res.status(200).json({ success: true, user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error updating user statistics" });
    }
});

// Get all submissions for a user for a specific problem
app.get("/api/problems/:id/submissions", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const problemId = req.params.id;
        const submissions = await Submission.find({ user: userId, problem: problemId })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, submissions });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        res.status(500).json({ success: false, message: "Error fetching submissions" });
    }
});

// ADMIN: Add a new problem
app.post('/admin/problem', adminMiddleware, async (req, res) => {
    try {
        const { name, code, statement, tags, difficulty, sampleTestCases, timeLimit, memoryLimit, inputFormat, outputFormat, constraints, editorial, isPublished } = req.body;
        
        if (!name || !code || !statement) {
            return res.status(400).json({ success: false, message: 'Name, code, and statement are required.' });
        }
        if (sampleTestCases && Array.isArray(sampleTestCases) && sampleTestCases.length > 2) {
            return res.status(400).json({ success: false, message: 'You can add at most 2 sample test cases.' });
        }
        
        const problemData = {
            name,
            code,
            statement,
            tags: tags || [],
            difficulty: (difficulty || 'easy').toLowerCase(),
            timeLimit,
            memoryLimit,
            samples: sampleTestCases || [],
            inputFormat: inputFormat || '',
            outputFormat: outputFormat || '',
            constraints: constraints || '',
            editorial: editorial || '',
            isPublished: isPublished !== undefined ? isPublished : false,
            createdBy: req.user._id
        };
        
        const problem = new Problem(problemData);
        await problem.save();
        res.status(201).json({ success: true, problem });
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ success: false, message: 'Error creating problem', error: error.message });
    }
});

// ADMIN: Add a new test case to a problem
app.post('/admin/testcase', adminMiddleware, async (req, res) => {
    try {
        const { problemId, input, output } = req.body;
        if (!problemId || !input || !output) {
            return res.status(400).json({ success: false, message: 'problemId (or code), input, and output are required.' });
        }
        let problem;
        let problemObjectId;
        if (mongoose.Types.ObjectId.isValid(problemId)) {
            problem = await Problem.findById(problemId);
            if (!problem) {
                return res.status(400).json({ success: false, message: 'Problem not found for the given problemId.' });
            }
            problemObjectId = problem._id;
        } else {
            // Treat as code (case-insensitive)
            problem = await Problem.findOne({ code: problemId.toUpperCase() });
            if (!problem) {
                return res.status(400).json({ success: false, message: 'Problem not found for the given code.' });
            }
            problemObjectId = problem._id;
        }
        const TestCase = (await import('./model/TestCase.js')).default;
        const lastTestCase = await TestCase.findOne({ problem: problemObjectId }).sort({ index: -1 });
        const nextIndex = lastTestCase ? lastTestCase.index + 1 : 1;
        const testCase = new TestCase({
            problem: problemObjectId,
            input,
            output,
            isSample: false,
            index: nextIndex
        });
        await testCase.save();
        res.status(201).json({ success: true, testCase });
    } catch (error) {
        console.error('Error creating test case:', error);
        res.status(500).json({ success: false, message: 'Error creating test case', error });
    }
});

// ADMIN: Add a new contest
app.post('/admin/contest', adminMiddleware, async (req, res) => {
    try {
        const { name, title, description, startTime, endTime, problems, difficulty, type, prizes } = req.body;
        // Accept either 'name' or 'title' for contest title
        const contestTitle = title || name;
        if (!contestTitle || !description || !startTime || !endTime || !problems || !difficulty || !type || !prizes) {
            return res.status(400).json({ success: false, message: 'Title, description, startTime, endTime, problems, difficulty, type, and prizes are required.' });
        }
        // Calculate durationMinutes from startTime and endTime
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start) || isNaN(end) || end <= start) {
            return res.status(400).json({ success: false, message: 'Invalid startTime or endTime.' });
        }
        const durationMinutes = Math.round((end - start) / 60000);
        if (durationMinutes < 10) {
            return res.status(400).json({ success: false, message: 'Duration must be at least 10 minutes.' });
        }
        // Accept problem codes or ObjectIds
        const problemObjectIds = [];
        for (const pid of problems) {
            if (mongoose.Types.ObjectId.isValid(pid)) {
                problemObjectIds.push(pid);
            } else {
                const problem = await Problem.findOne({ code: pid.toUpperCase() });
                if (!problem) {
                    return res.status(400).json({ success: false, message: `Problem not found for code: ${pid}` });
                }
                problemObjectIds.push(problem._id);
            }
        }
        // Prizes: ensure it's an array
        let prizesArr = prizes;
        if (typeof prizes === 'string') {
            prizesArr = prizes.split(',').map(p => p.trim()).filter(Boolean);
        }
        if (!Array.isArray(prizesArr) || prizesArr.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one prize is required.' });
        }
        const contest = new Contest({
            title: contestTitle,
            description,
            startTime: start,
            durationMinutes,
            difficulty: difficulty.toLowerCase(),
            type: type.toLowerCase(),
            prizes: prizesArr,
            problems: problemObjectIds,
            createdBy: req.user._id
        });
        await contest.save();
        res.status(201).json({ success: true, contest });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating contest', error });
    }
});

// Get problem by code
app.get('/api/problems/code/:code', async (req, res) => {
    try {
        const problem = await Problem.findOne({ code: req.params.code.toUpperCase() })
            .populate('createdBy', 'firstname lastname');
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }
        res.status(200).json({ success: true, problem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching problem' });
    }
});

// Submit solution by problem code
app.post('/api/problems/code/:code/submit', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const { language, code: submittedCode, contestId } = req.body;
        const problem = await Problem.findOne({ code: req.params.code.toUpperCase() });
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }
        
        // Validate problem has proper time and memory limits
        if (!problem.timeLimit || !problem.memoryLimit) {
            return res.status(500).json({ success: false, message: "Problem configuration error: missing time or memory limits" });
        }
        
        if (!language || !submittedCode) {
            return res.status(400).json({ success: false, message: 'Language and code are required' });
        }
        // Fetch all test cases for the problem
        let testCases = await TestCase.find({ problem: problem._id }).sort({ index: 1 });
        // Add sample test cases from problem.samples
        let sampleTestCases = [];
        if (problem.samples && Array.isArray(problem.samples) && problem.samples.length > 0) {
            sampleTestCases = problem.samples.map((s, idx) => ({
                input: s.input,
                output: s.output,
                isSample: true,
                index: -(idx + 1) // negative index to keep samples at the top
            }));
        }
        // Mark all regular test cases as isSample: false
        testCases = testCases.map(tc => ({ ...tc.toObject(), isSample: false }));
        // Combine, samples first
        const allTestCases = [...sampleTestCases, ...testCases];
        if (!allTestCases.length) {
            return res.status(400).json({ success: false, message: 'No test cases found for this problem.' });
        }
        // Generate file for user code
        let filePath;
        try {
            filePath = await generateFileRemote(language, submittedCode);
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Error generating code file.' });
        }
        // Run code against each test case
        let allPassed = true;
        let firstError = null;
        let firstErrorStatus = null;
        const testCaseResults = [];
        let maxMemoryUsed = 0;
        let maxExecTime = 0;
        
        for (const tc of allTestCases) {
            let userOutput = "";
            let error = "";
            let testCaseMemory = 0;
            let testCaseExecTime = 0;
            let status = 'accepted';
            try {
                const result = await executeCode(language, filePath, tc.input, problem.timeLimit * 1000, problem.memoryLimit);
                userOutput = result.output;
                testCaseMemory = result.memoryUsed || 0;
                testCaseExecTime = result.execTime || 0;
                userOutput = (userOutput || '').replace(/\r\n/g, '\n').trim();
                maxMemoryUsed = Math.max(maxMemoryUsed, testCaseMemory);
                maxExecTime = Math.max(maxExecTime, testCaseExecTime);
            } catch (err) {
                error = err.error || err.message || String(err);
                testCaseMemory = err.memoryUsed || 0;
                testCaseExecTime = err.execTime || 0;
                status = err.status || 'runtime_error';
                maxMemoryUsed = Math.max(maxMemoryUsed, testCaseMemory);
                maxExecTime = Math.max(maxExecTime, testCaseExecTime);
                allPassed = false;
                
                // Track the first error and its status for overall submission status
                if (!firstError) {
                    firstError = error;
                    firstErrorStatus = status;
                }
            }
            const expected = (tc.output || '').replace(/\r\n/g, '\n').trim();
            const isCorrect = !error && userOutput === expected;
            if (!isCorrect && !error) {
                status = 'wrong_answer';
                allPassed = false;
                if (!firstError) {
                    firstError = 'Wrong answer';
                    firstErrorStatus = 'wrong_answer';
                }
            }
            testCaseResults.push({
                input: tc.input,
                expectedOutput: tc.output,
                userOutput,
                isCorrect,
                error,
                isSample: tc.isSample,
                execTime: testCaseExecTime,
                status: status
            });
        }
        const totalExecutionTime = maxExecTime;
        const finalMemoryUsed = Math.round(maxMemoryUsed / 1024); // Convert KB to MB
        
        // Determine overall submission status based on first error
        let overallStatus = determineStatus(allPassed, firstErrorStatus);
        
        // Save submission with detailed results
        const submission = await Submission.create({
            user: userId,
            problem: problem._id,
            language,
            code: submittedCode,
            isContestSubmission: !!contestId,
            contest: contestId || null,
            status: overallStatus,
            testCasesPassed: testCaseResults.filter(tc => tc.isCorrect).length,
            totalTestCases: testCaseResults.length,
            testCaseResults,
            errorMessage: firstError || "",
            score: allPassed ? 100 : 0,
            executionTime: Number(totalExecutionTime).toFixed(2),
            memoryUsed: finalMemoryUsed
        });
        // Update user's solved problems and stats if accepted
        if (overallStatus === 'accepted') {
            const user = await User.findById(userId);
            if (!user.solvedProblems.map(id => id.toString()).includes(problem._id.toString())) {
                await User.findByIdAndUpdate(userId, {
                    $addToSet: { solvedProblems: problem._id },
                    $inc: { problemsSolved: 1, [`problemsByTag.${problem.difficulty}`]: 1 }
                });
                // Also increment rating by 10 in the leaderboard
                await Leaderboard.findOneAndUpdate(
                    { user: userId },
                    { $inc: { rating: 10, solved: 1 } },
                    { upsert: true }
                );
            }
        }
        res.status(201).json({ success: true, submission, testCaseResults });
    } catch (error) {
        console.error('Error in /api/problems/code/:code/submit:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Error submitting solution', error: error.message });
    }
});

// Get all submissions for a user for a specific problem by code
app.get('/api/problems/code/:code/submissions', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const userId = decoded.id;
        const problem = await Problem.findOne({ code: req.params.code.toUpperCase() });
        if (!problem) {
            return res.status(404).json({ success: false, message: 'Problem not found' });
        }
        const submissions = await Submission.find({ user: userId, problem: problem._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, submissions });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Error fetching submissions' });
    }
});

// Get all discussions for a problem
app.get("/api/problems/:problemId/discussions", async (req, res) => {
    try {
        const { problemId } = req.params;
        const discussions = await Discussion.find({ problemId })
            .populate('userId', 'username firstname lastname badge')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, discussions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching discussions" });
    }
});

// Post a new discussion for a problem
app.post("/api/problems/:problemId/discussions", authMiddleware, async (req, res) => {
    try {
        const { problemId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        if (!content || content.trim().length < 5) {
            return res.status(400).json({ success: false, message: "Content must be at least 5 characters long." });
        }
        const discussion = await Discussion.create({
            problemId,
            userId,
            content: content.trim()
        });
        res.status(201).json({ success: true, discussion });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error posting discussion" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT);

let didListen = false;

server.on('listening', () => {
    didListen = true;
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the server at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        if (!didListen) {
            console.error(`Port ${PORT} is already in use. Please try a different port or stop the process using this port.`);
            console.error('You can try:');
            console.error(`1. Kill the process using port ${PORT}`);
            console.error(`2. Change the port in the code to a different number (e.g., 5001)`);
        }
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

// Scheduled job: Update contests to 'ongoing' when startTime is reached
setInterval(async () => {
    try {
        const now = new Date();
        const result = await Contest.updateMany(
            { status: 'upcoming', startTime: { $lte: now } },
            { $set: { status: 'ongoing' } }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Contest Status Update] Set ${result.modifiedCount} contest(s) to 'ongoing' at ${now.toISOString()}`);
        }
        // Robustly update contests to 'past' when endTime is reached
        const ongoingContests = await Contest.find({ status: 'ongoing' });
        let pastCount = 0;
        for (const contest of ongoingContests) {
            const endTime = new Date(contest.startTime.getTime() + contest.durationMinutes * 60000);
            if (now >= endTime) {
                contest.status = 'past';
                await contest.save();
                pastCount++;
                console.log(`[Contest Status Update] Contest "${contest.title}" set to 'past' at ${now.toISOString()}`);
            }
        }
        if (pastCount > 0) {
            console.log(`[Contest Status Update] Set ${pastCount} contest(s) to 'past' at ${now.toISOString()}`);
        }
    } catch (err) {
        console.error('[Contest Status Update] Error updating contest statuses:', err);
    }
}, 60 * 1000); // Every 1 minute
