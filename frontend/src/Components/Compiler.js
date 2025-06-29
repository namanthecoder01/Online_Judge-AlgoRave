import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import bgImg from './Assets/bg_img.jpg';
import './Compiler.css'; // Use a separate CSS for Compiler
import axios from 'axios';
import { badgeColors } from '../theme';
import ReactMarkdown from 'react-markdown';

const defaultCode = {
    'python': '# Write your Python code here\n\n',
    'cpp': '# Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
    'java': '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}'
};

const Compiler = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('compiler');
    const [user, setUser] = useState(null);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(defaultCode['python']);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [theme] = useState('hacker');
    const codeEditorRef = useRef();
    
    // AI Review states
    const [aiReview, setAiReview] = useState('');
    const [aiExplanation, setAiExplanation] = useState('');
    const [aiOptimization, setAiOptimization] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeAiTab, setActiveAiTab] = useState('review');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(userData));
    }, [navigate]);

    useEffect(() => {
        // Set --glow-color to user's badge color
        let badge = 'Code Novice';
        if (user && user.badge) {
            badge = user.badge;
        } else {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    badge = JSON.parse(userData).badge || 'Code Novice';
                } catch {}
            }
        }
        document.documentElement.style.setProperty('--glow-color', badgeColors[badge] || '#00FF00');
        return () => {
            // Optionally reset to default or badge color
            document.documentElement.style.setProperty('--glow-color', badgeColors[badge] || '#00FF00');
        };
    }, [user]);

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        setCode(defaultCode[e.target.value]);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('Compiling and running your code...\n');
        try {
            const payload = {
                language,
                code,
                input
            };
            // Change the URL below if your backend runs on a different port
            const { data } = await axios.post('http://localhost:8000/run', payload);
            setOutput(data.output || JSON.stringify(data));
        } catch (error) {
            let errMsg = error.response?.data?.error || error.message;
            if (typeof errMsg === 'object') {
                errMsg = JSON.stringify(errMsg);
            }
            setOutput('Error: ' + errMsg);
        }
        setIsRunning(false);
    };

    const handleCodeKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = code.substring(0, start) + '    ' + code.substring(end);
            setCode(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);
        }
    };

    // Calculate line numbers
    const lineCount = code.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

    const handleAiReview = async () => {
        if (!code.trim()) {
            setOutput('Error: Please write some code before requesting AI review');
            return;
        }
        
        setIsAiLoading(true);
        setAiReview('Generating AI code review...');
        
        try {
            const { data } = await axios.post('http://localhost:8000/ai/review', {
                code,
                language
            });
            setAiReview(data.review);
            setActiveAiTab('review');
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setAiReview(`Error: ${errorMsg}`);
        }
        setIsAiLoading(false);
    };

    const handleAiExplanation = async () => {
        if (!code.trim()) {
            setOutput('Error: Please write some code before requesting AI explanation');
            return;
        }
        
        setIsAiLoading(true);
        setAiExplanation('Generating AI code explanation...');
        
        try {
            const { data } = await axios.post('http://localhost:8000/ai/explain', {
                code,
                language
            });
            setAiExplanation(data.explanation);
            setActiveAiTab('explain');
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setAiExplanation(`Error: ${errorMsg}`);
        }
        setIsAiLoading(false);
    };

    const handleAiOptimization = async () => {
        if (!code.trim()) {
            setOutput('Error: Please write some code before requesting AI optimization');
            return;
        }
        
        setIsAiLoading(true);
        setAiOptimization('Generating AI optimization suggestions...');
        
        try {
            const { data } = await axios.post('http://localhost:8000/ai/optimize', {
                code,
                language
            });
            setAiOptimization(data.optimization);
            setActiveAiTab('optimize');
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setAiOptimization(`Error: ${errorMsg}`);
        }
        setIsAiLoading(false);
    };

    return (
        <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            <div className="solve-problem-container solve-problem-flexcard glow-effect">
                <div className="solve-problem-left">
                    <div className="editor-section glow-effect" style={{ flex: 1 }}>
                        <div className="editor-header">
                            <div className="language-select-wrapper">
                                <select 
                                    value={language}
                                    onChange={handleLanguageChange}
                                    className="language-select"
                                    disabled={isRunning}
                                >
                                    <option value="python">Python</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
                            <pre
                                className="code-line-numbers"
                                style={{
                                    userSelect: 'none',
                                    textAlign: 'right',
                                    padding: '1rem 0.5rem 1rem 0',
                                    margin: 0,
                                    minWidth: 32,
                                    color: '#888',
                                    background: 'transparent',
                                    fontFamily: 'Fira Mono, Consolas, Menlo, monospace',
                                    fontSize: '1.08rem',
                                    lineHeight: '1.5',
                                    borderRight: '1.5px solid #222',
                                }}
                            >
                                {lineNumbers}
                            </pre>
                            <textarea
                                ref={codeEditorRef}
                                className="code-editor"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleCodeKeyDown}
                                placeholder="Write your code here..."
                                disabled={isRunning}
                                style={{
                                    minHeight: '400px',
                                    backgroundColor: theme === 'hacker' ? '#0a0a0a' : 
                                                theme === 'cyberpunk' ? '#0c0b1a' : '#121212',
                                    color: theme === 'hacker' ? '#00ff00' : 
                                            theme === 'cyberpunk' ? '#00fff9' : '#fff',
                                    borderColor: theme === 'hacker' ? '#00ff00' : 
                                                theme === 'cyberpunk' ? '#ff00ff' : '#333',
                                    width: '100%',
                                    resize: 'vertical',
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="solve-problem-right">
                    <div className="testcase-section glow-effect" style={{ marginBottom: '1rem' }}>
                        <h3>Input</h3>
                        <textarea
                            className="input-area"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter your input here..."
                            disabled={isRunning}
                            style={{
                                backgroundColor: theme === 'hacker' ? '#0a0a0a' : 
                                               theme === 'cyberpunk' ? '#0c0b1a' : '#121212',
                                color: theme === 'hacker' ? '#00ff00' : 
                                       theme === 'cyberpunk' ? '#00fff9' : '#fff',
                                borderColor: theme === 'hacker' ? '#00ff00' : 
                                           theme === 'cyberpunk' ? '#ff00ff' : '#333'
                            }}
                        />
                    </div>
                    
                    {/* AI Review Section */}
                    <div className="testcase-section glow-effect" style={{ marginBottom: '1rem' }}>
                        <h3>🤖 AI Assistant</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                                className={`ai-tab-btn ${activeAiTab === 'review' ? 'active' : ''}`}
                                onClick={() => setActiveAiTab('review')}
                                disabled={isAiLoading}
                                style={{
                                    background: activeAiTab === 'review' ? '#00ff00' : 'transparent',
                                    color: activeAiTab === 'review' ? '#000' : '#00ff00',
                                    border: '1px solid #00ff00',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Review
                            </button>
                            <button
                                className={`ai-tab-btn ${activeAiTab === 'explain' ? 'active' : ''}`}
                                onClick={() => setActiveAiTab('explain')}
                                disabled={isAiLoading}
                                style={{
                                    background: activeAiTab === 'explain' ? '#00ff00' : 'transparent',
                                    color: activeAiTab === 'explain' ? '#000' : '#00ff00',
                                    border: '1px solid #00ff00',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Explain
                            </button>
                            <button
                                className={`ai-tab-btn ${activeAiTab === 'optimize' ? 'active' : ''}`}
                                onClick={() => setActiveAiTab('optimize')}
                                disabled={isAiLoading}
                                style={{
                                    background: activeAiTab === 'optimize' ? '#00ff00' : 'transparent',
                                    color: activeAiTab === 'optimize' ? '#000' : '#00ff00',
                                    border: '1px solid #00ff00',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Optimize
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            {activeAiTab === 'review' && (
                                <button
                                    className="ai-action-btn"
                                    onClick={handleAiReview}
                                    disabled={isAiLoading || !code.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff00',
                                        border: '1px solid #00ff00',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !code.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !code.trim() ? 0.5 : 1,
                                        width: '100%'
                                    }}
                                >
                                    {isAiLoading ? 'Generating Review...' : 'Get AI Code Review'}
                                </button>
                            )}
                            {activeAiTab === 'explain' && (
                                <button
                                    className="ai-action-btn"
                                    onClick={handleAiExplanation}
                                    disabled={isAiLoading || !code.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff00',
                                        border: '1px solid #00ff00',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !code.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !code.trim() ? 0.5 : 1,
                                        width: '100%'
                                    }}
                                >
                                    {isAiLoading ? 'Generating Explanation...' : 'Explain My Code'}
                                </button>
                            )}
                            {activeAiTab === 'optimize' && (
                                <button
                                    className="ai-action-btn"
                                    onClick={handleAiOptimization}
                                    disabled={isAiLoading || !code.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff00',
                                        border: '1px solid #00ff00',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !code.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !code.trim() ? 0.5 : 1,
                                        width: '100%'
                                    }}
                                >
                                    {isAiLoading ? 'Generating Optimizations...' : 'Optimize My Code'}
                                </button>
                            )}
                        </div>
                        
                        <div className="ai-output-section">
                            {activeAiTab === 'review' && aiReview && (
                                <div style={{
                                    backgroundColor: '#0a0a0a',
                                    color: '#00ff00',
                                    border: '1px solid #00ff00',
                                    borderRadius: '4px',
                                    padding: '1rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    <ReactMarkdown>{aiReview}</ReactMarkdown>
                                </div>
                            )}
                            {activeAiTab === 'explain' && aiExplanation && (
                                <div style={{
                                    backgroundColor: '#0a0a0a',
                                    color: '#00ff00',
                                    border: '1px solid #00ff00',
                                    borderRadius: '4px',
                                    padding: '1rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                                </div>
                            )}
                            {activeAiTab === 'optimize' && aiOptimization && (
                                <div style={{
                                    backgroundColor: '#0a0a0a',
                                    color: '#00ff00',
                                    border: '1px solid #00ff00',
                                    borderRadius: '4px',
                                    padding: '1rem',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    <ReactMarkdown>{aiOptimization}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="testcase-section glow-effect">
                        <h3>Output</h3>
                        <textarea
                            className="output-area"
                            value={output}
                            readOnly
                            placeholder="Output will appear here..."
                            style={{
                                backgroundColor: theme === 'hacker' ? '#0a0a0a' : 
                                               theme === 'cyberpunk' ? '#0c0b1a' : '#121212',
                                color: theme === 'hacker' ? '#00ff00' : 
                                       theme === 'cyberpunk' ? '#00fff9' : '#fff',
                                borderColor: theme === 'hacker' ? '#00ff00' : 
                                           theme === 'cyberpunk' ? '#ff00ff' : '#333',
                                minHeight: '200px'
                            }}
                        />
                    </div>
                    <div className="button-group">
                        <button
                            className="run-btn glow-effect"
                            onClick={handleRun}
                            disabled={isRunning}
                            style={{
                                background: 'transparent',
                                width: '100%',
                                marginTop: '1rem',
                                opacity: isRunning ? 0.7 : 1
                            }}
                        >
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Compiler;