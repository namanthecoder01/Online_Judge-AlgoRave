import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API });

export const aiCodeReview = async (code, language = 'general') => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `You are a code review assistant. Review the following ${language} code. 
If the code is trivial (e.g., a single print statement or a very short snippet), just acknowledge that and do not suggest unnecessary improvements. 
Only provide concise, practical suggestions that would actually improve the code in a real-world context. Avoid boilerplate advice for simple code.

Code:
${code}
`,
        });
        return response.text;
    } catch (error) {
        console.error('AI Code Review Error:', error);
        throw new Error('Failed to generate code review. Please try again later.');
    }
};

export const aiCodeExplanation = async (code, language = 'general') => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `You are a code explanation assistant. Explain the following ${language} code.
If the code is very simple (e.g., a single print statement or a basic assignment), give a brief, 1-2 sentence explanation.
If the code is more complex, provide a clear, educational explanation, but keep it concise and avoid unnecessary detail.

Code:
${code}
`,
        });
        return response.text;
    } catch (error) {
        console.error('AI Code Explanation Error:', error);
        throw new Error('Failed to generate code explanation. Please try again later.');
    }
};

export const aiCodeOptimization = async (code, language = 'general') => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `You are a code optimization assistant. Analyze the following ${language} code and provide optimization suggestions.
If the code is already optimal, very simple, or cannot be meaningfully optimized, just acknowledge that and do not suggest unnecessary changes. Be brief for trivial code.
If the code can be improved, provide concise, practical suggestions.

Code:
${code}
`,
        });
        return response.text;
    } catch (error) {
        console.error('AI Code Optimization Error:', error);
        throw new Error('Failed to generate optimization suggestions. Please try again later.');
    }
}; 