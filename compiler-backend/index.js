import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
import { v4 as uuid } from "uuid";
import { executeCpp } from "./executeCpp.js";
import { executePython } from "./executePython.js";
import { executeJava } from "./executeJava.js";
import { aiCodeReview, aiCodeExplanation, aiCodeOptimization } from "./aiService.js";
import { generateFile } from "./generateFile.js";

dotenv.config();

const app = express();

// Setup codes directory
const dirCodes = path.join(__dirname, 'codes');
if (!fs.existsSync(dirCodes)) {
    fs.mkdirSync(dirCodes, { recursive: true });
}

// Helper function to get file extension
const getExtension = (language) => {
    switch(language) {
        case 'cpp': return 'cpp';
        case 'python': return 'py';
        case 'java': return 'java';
        default: return 'txt';
    }
};

app.use(cors({
    origin: true, // Allow all origins temporarily
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ online: 'compiler' });
});

app.post("/run", async (req, res) => {
    let { language = 'cpp', code, input = "", timeLimit = 5000, memoryLimit = 256 } = req.body;
    let filePath;
    if (code === undefined) {
        return res.status(404).json({ success: false, error: "Empty code!" });
    }
    try {
        filePath = generateFile(language, code);
        console.log('Language:', language, 'File:', filePath);
        // Patch: force language based on file extension
        if (filePath.endsWith('.java')) language = 'java';
        if (filePath.endsWith('.py')) language = 'python';
        let output;
        let memoryUsed = 0;
        let execTime = 0;
        let status = 'accepted';
        switch(language) {
            case 'cpp':
                const cppResult = await executeCpp(filePath, input, timeLimit, memoryLimit);
                output = cppResult.output;
                memoryUsed = cppResult.memoryUsed || 0;
                execTime = cppResult.execTime || 0;
                break;
            case 'python':
                const pythonResult = await executePython(filePath, input, timeLimit, memoryLimit);
                output = pythonResult.output;
                memoryUsed = pythonResult.memoryUsed || 0;
                execTime = pythonResult.execTime || 0;
                break;
            case 'java':
                const javaResult = await executeJava(filePath, input, timeLimit, memoryLimit);
                output = javaResult.output;
                memoryUsed = javaResult.memoryUsed || 0;
                execTime = javaResult.execTime || 0;
                break;
            default:
                throw new Error('Unsupported language');
        }
        res.json({ filePath, output, memoryUsed: +(memoryUsed / 1024).toFixed(2), execTime, status }); // Convert KB to MB, 2 decimals
    } catch (error) {
        let errorMsg = error;
        let memoryUsed = 0;
        let execTime = 0;
        let status = 'runtime_error';
        if (typeof error === 'object') {
            errorMsg = error.error || error.message || error.stderr || JSON.stringify(error);
            memoryUsed = error.memoryUsed || 0;
            execTime = error.execTime || 0;
            status = error.status || 'runtime_error';
        }
        // Simplify error output: replace unique filenames with generic ones
        if (filePath) {
            if (filePath.endsWith('.cpp')) {
                const uniqueName = filePath.split(/[\\/]/).pop();
                errorMsg = errorMsg.split(uniqueName).join('Main.cpp');
            } else if (filePath.endsWith('.java')) {
                const uniqueName = filePath.split(/[\\/]/).pop().replace('.java', '');
                errorMsg = errorMsg.split(uniqueName).join('Main');
                errorMsg = errorMsg.split(uniqueName + '.java').join('Main.java');
            } else if (filePath.endsWith('.py')) {
                const uniqueName = filePath.split(/[\\/]/).pop();
                errorMsg = errorMsg.split(uniqueName).join('main.py');
            }
        }
        console.error('Execution error:', errorMsg);
        res.status(200).json({ output: errorMsg, memoryUsed: Math.round(memoryUsed / 1024), execTime, status }); // Convert KB to MB
    }
});

// Add the missing /generate-file endpoint
app.post("/generate-file", async (req, res) => {
    try {
        const { language, code } = req.body;
        if (!language || !code) {
            return res.status(400).json({ success: false, error: "Language and code are required" });
        }
        const filePath = generateFile(language, code);
        res.json({ success: true, filePath });
    } catch (error) {
        console.error('Generate file error:', error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate file" });
    }
});

// Add the missing /execute endpoint
app.post("/execute", async (req, res) => {
    try {
        const { language, filePath, input, timeLimit, memoryLimit } = req.body;
        if (!language || !filePath) {
            return res.status(400).json({ success: false, error: "Language and filePath are required" });
        }
        
        let output;
        let memoryUsed = 0;
        let execTime = 0;
        let status = 'accepted';
        
        switch(language) {
            case 'cpp':
                const cppResult = await executeCpp(filePath, input || "", timeLimit || 5000, memoryLimit || 256);
                output = cppResult.output;
                memoryUsed = cppResult.memoryUsed || 0;
                execTime = cppResult.execTime || 0;
                break;
            case 'python':
                const pythonResult = await executePython(filePath, input || "", timeLimit || 5000, memoryLimit || 256);
                output = pythonResult.output;
                memoryUsed = pythonResult.memoryUsed || 0;
                execTime = pythonResult.execTime || 0;
                break;
            case 'java':
                const javaResult = await executeJava(filePath, input || "", timeLimit || 5000, memoryLimit || 256);
                output = javaResult.output;
                memoryUsed = javaResult.memoryUsed || 0;
                execTime = javaResult.execTime || 0;
                break;
            default:
                throw new Error('Unsupported language');
        }
        
        res.json({ 
            success: true, 
            output, 
            memoryUsed: Math.round(memoryUsed / 1024), 
            execTime, 
            status 
        });
    } catch (error) {
        let errorMsg = error;
        let memoryUsed = 0;
        let execTime = 0;
        let status = 'runtime_error';
        
        if (typeof error === 'object') {
            errorMsg = error.error || error.message || error.stderr || JSON.stringify(error);
            memoryUsed = error.memoryUsed || 0;
            execTime = error.execTime || 0;
            status = error.status || 'runtime_error';
        }
        
        // Simplify error output: replace unique filenames with generic ones
        if (req.body.filePath) {
            const filePath = req.body.filePath;
            if (filePath.endsWith('.cpp')) {
                const uniqueName = filePath.split(/[\\/]/).pop();
                errorMsg = errorMsg.split(uniqueName).join('Main.cpp');
            } else if (filePath.endsWith('.java')) {
                const uniqueName = filePath.split(/[\\/]/).pop().replace('.java', '');
                errorMsg = errorMsg.split(uniqueName).join('Main');
                errorMsg = errorMsg.split(uniqueName + '.java').join('Main.java');
            } else if (filePath.endsWith('.py')) {
                const uniqueName = filePath.split(/[\\/]/).pop();
                errorMsg = errorMsg.split(uniqueName).join('main.py');
            }
        }
        
        console.error('Execution error:', errorMsg);
        res.status(200).json({ 
            success: false, 
            error: errorMsg, 
            memoryUsed: Math.round(memoryUsed / 1024), 
            execTime, 
            status 
        });
    }
});

app.post("/ai/review", async (req, res) => {
    try {
        const { code, language = 'general' } = req.body;
        
        if (!code || code.trim() === '') {
            return res.status(400).json({ success: false, error: "Code is required for AI review" });
        }

        const review = await aiCodeReview(code, language);
        res.json({ success: true, review });
    } catch (error) {
        console.error('AI Review Error:', error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate code review" });
    }
});

app.post("/ai/explain", async (req, res) => {
    try {
        const { code, language = 'general' } = req.body;
        
        if (!code || code.trim() === '') {
            return res.status(400).json({ success: false, error: "Code is required for AI explanation" });
        }

        const explanation = await aiCodeExplanation(code, language);
        res.json({ success: true, explanation });
    } catch (error) {
        console.error('AI Explanation Error:', error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate code explanation" });
    }
});

app.post("/ai/optimize", async (req, res) => {
    try {
        const { code, language = 'general' } = req.body;
        
        if (!code || code.trim() === '') {
            return res.status(400).json({ success: false, error: "Code is required for AI optimization" });
        }

        const optimization = await aiCodeOptimization(code, language);
        res.json({ success: true, optimization });
    } catch (error) {
        console.error('AI Optimization Error:', error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate optimization suggestions" });
    }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});