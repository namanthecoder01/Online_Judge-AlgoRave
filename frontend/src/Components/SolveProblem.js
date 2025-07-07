import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './SolveProblem.css';
import bgImg from './Assets/bg_hack.jpg';
import { syncUserProfile } from '../utils/userSync';
import axios from 'axios';
import { difficultyColors, badgeColors } from '../theme';
import ReactMarkdown from 'react-markdown';
import { BACKEND_URL, COMPILER_URL } from '../utils/apiEndpoints';

const defaultCode = {
    cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}',
    java: 'public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}',
    python: '# Write your code here\n'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'accepted': return 'limegreen';
        case 'wrong_answer': return 'red';
        case 'pending': return 'orange';
        case 'compilation_error': return 'purple';
        case 'runtime_error': return 'crimson';
        default: return 'gray';
    }
};

const SolveProblem = () => {
    const { code: problemCode } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('cpp');
    const [editorCode, setEditorCode] = useState(defaultCode.cpp);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [runLoading, setRunLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('problems');
    const [problemViewTab, setProblemViewTab] = useState('problem');
    const [testOutputTab, setTestOutputTab] = useState('testcase');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsError, setSubmissionsError] = useState(null);
    const [viewCode, setViewCode] = useState(null);
    const [testCaseResults, setTestCaseResults] = useState(null);
    const [discussions, setDiscussions] = useState([]);
    const [discussionsLoading, setDiscussionsLoading] = useState(false);
    const [discussionsError, setDiscussionsError] = useState(null);
    const [newDiscussion, setNewDiscussion] = useState("");
    const [postingDiscussion, setPostingDiscussion] = useState(false);
    const [submissionMeta, setSubmissionMeta] = useState(null);
    const codeEditorRef = useRef();
    const [errorModal, setErrorModal] = useState(null);
    
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
        const fetchProblem = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/problems/code/${problemCode}`);
                const data = await response.json();
                if (data.success) {
                    setProblem(data.problem);
                    if (data.problem.samples && data.problem.samples.length > 0) {
                        setInput(data.problem.samples[0].input);
                    }
                } else {
                    setError('Problem not found');
                }
            } catch (err) {
                setError('Error fetching problem');
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [problemCode]);

    const fetchSubmissions = useCallback(async () => {
        setSubmissionsLoading(true);
        setSubmissionsError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/api/problems/code/${problemCode}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
            } else {
                setSubmissionsError(data.message || 'Failed to fetch submissions');
            }
        } catch (err) {
            setSubmissionsError('Failed to fetch submissions');
        } finally {
            setSubmissionsLoading(false);
        }
    }, [problemCode]);

    useEffect(() => {
        if (problemViewTab === 'submissions') {
            fetchSubmissions();
        }
    }, [problemViewTab, problemCode, fetchSubmissions]);

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        setEditorCode(defaultCode[e.target.value]);
    };

    const handleRun = async () => {
        setTestOutputTab('output');
        setRunLoading(true);
        setOutput('Compiling and running your code...\n');
        try {
            const payload = {
                language,
                code: editorCode,
                input
            };
            const { data } = await axios.post(`${COMPILER_URL}/run`, payload);
            setOutput(data.output || JSON.stringify(data));
        } catch (error) {
            let errMsg = error.response?.data?.error || error.message;
            if (typeof errMsg === 'object') {
                errMsg = JSON.stringify(errMsg);
            }
            setOutput('Error: ' + errMsg);
        }
        setRunLoading(false);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        setRunLoading(true);
        setTestCaseResults(null);
        setSubmissionMeta(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/problems/code/${problemCode}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    language,
                    code: editorCode
                })
            });
            const data = await res.json();
            if (data.success) {
                setOutput('Submission successful! See detailed test case analysis below.');
                setTestCaseResults(data.testCaseResults || null);
                setSubmissionMeta(data.submission || null);
                setTimeout(async () => {
                    await syncUserProfile(token);
                }, 2500);
                if (problemViewTab === 'submissions') {
                    fetchSubmissions();
                }
                // Fetch updated user profile and update localStorage/state
                const profileRes = await fetch(`${BACKEND_URL}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const profileData = await profileRes.json();
                if (profileData.success) {
                    localStorage.setItem('user', JSON.stringify(profileData.user));
                    setUser(profileData.user);
                }
            } else {
                setOutput(`Submission failed: ${data.message}`);
                setTestCaseResults(null);
                setSubmissionMeta(null);
            }
        } catch (err) {
            setOutput('Error submitting solution. Please try again.');
            setTestCaseResults(null);
            setSubmissionMeta(null);
        } finally {
            setRunLoading(false);
        }
    };

    const handleCodeKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = editorCode.substring(0, start) + '    ' + editorCode.substring(end);
            setEditorCode(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);
        }
    };

    const handleAiReview = async () => {
        if (!editorCode.trim()) {
            setOutput('Error: Please write some code before requesting AI review');
            return;
        }
        
        setIsAiLoading(true);
        setAiReview('Generating AI code review...');
        
        try {
            const { data } = await axios.post(`${COMPILER_URL}/ai/review`, {
                code: editorCode,
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
        if (!editorCode.trim()) {
            setOutput('Error: Please write some code before requesting AI explanation');
            return;
        }
        
        setIsAiLoading(true);
        setAiExplanation('Generating AI code explanation...');
        
        try {
            const { data } = await axios.post(`${COMPILER_URL}/ai/explain`, {
                code: editorCode,
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
        if (!editorCode.trim()) {
            setOutput('Error: Please write some code before requesting AI optimization');
            return;
        }
        
        setIsAiLoading(true);
        setAiOptimization('Generating AI optimization suggestions...');
        
        try {
            const { data } = await axios.post(`${COMPILER_URL}/ai/optimize`, {
                code: editorCode,
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

    // Calculate line numbers
    const lineCount = editorCode.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

    // Fetch discussions when tab is active and problem is loaded
    useEffect(() => {
        const fetchDiscussions = async () => {
            if (!problem || !problem._id) return;
            setDiscussionsLoading(true);
            setDiscussionsError(null);
            try {
                const res = await fetch(`${BACKEND_URL}/api/problems/${problem._id}/discussions`);
                const data = await res.json();
                if (data.success) {
                    setDiscussions(data.discussions);
                } else {
                    setDiscussionsError(data.message || 'Failed to fetch discussions');
                }
            } catch (err) {
                setDiscussionsError('Failed to fetch discussions');
            } finally {
                setDiscussionsLoading(false);
            }
        };
        if (problemViewTab === 'discussions' && problem && problem._id) {
            fetchDiscussions();
        }
    }, [problemViewTab, problem]);

    // Post a new discussion
    const handlePostDiscussion = async (e) => {
        e.preventDefault();
        if (!newDiscussion.trim()) return;
        setPostingDiscussion(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/api/problems/${problem._id}/discussions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newDiscussion })
            });
            const data = await res.json();
            if (data.success) {
                setNewDiscussion("");
                setDiscussions([data.discussion, ...discussions]);
            } else {
                alert(data.message || 'Failed to post discussion');
            }
        } catch (err) {
            alert('Failed to post discussion');
        } finally {
            setPostingDiscussion(false);
        }
    };

    useEffect(() => {
        if (problem && problem.difficulty) {
            // Set glow color to difficulty color
            document.documentElement.style.setProperty('--glow-color', difficultyColors[problem.difficulty] || '#00FF00');
        }
        return () => {
            // On unmount, reset to badge color or default
            const userData = localStorage.getItem('user');
            let badge = 'Code Novice';
            if (userData) {
                try {
                    badge = JSON.parse(userData).badge || 'Code Novice';
                } catch {}
            }
            document.documentElement.style.setProperty('--glow-color', badgeColors[badge] || '#00FF00');
        };
    }, [problem]);

    if (loading) return (
        <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
            <div className="solve-problem-navbar"></div>
            <div className="solve-problem-container">Loading...</div>
        </div>
    );
    if (error) return (
        <div className="solve-problem-bg" style={{backgroundImage: `url(${bgImg})`}}>
            <div className="solve-problem-navbar"></div>
            <div className="solve-problem-container error">{error}</div>
        </div>
    );
    if (!problem) return (
        <div className={`solve-problem-bg ${problem.difficulty}`} style={{backgroundImage: `url(${bgImg})`}}>
            <div className="solve-problem-navbar"></div>
            <div className="solve-problem-container error">Problem not found</div>
        </div>
    );

    return (
        <div className={`solve-problem-bg ${problem.difficulty}`} style={{backgroundImage: `url(${bgImg})`}}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
            <div className="solve-problem-container solve-problem-flexcard">
                <div className="solve-problem-left">
                    <div className="problem-view-nav">
                        <button 
                            className={`problem-view-nav-item ${problemViewTab === 'problem' ? 'active' : ''}`}
                            onClick={() => setProblemViewTab('problem')}>
                            Problem
                        </button>
                        <button 
                            className={`problem-view-nav-item ${problemViewTab === 'submissions' ? 'active' : ''}`}
                            onClick={() => setProblemViewTab('submissions')}>
                            Submissions
                        </button>
                        <button 
                            className={`problem-view-nav-item ${problemViewTab === 'discussions' ? 'active' : ''}`}
                            onClick={() => setProblemViewTab('discussions')}>
                            Discussions
                        </button>
                    </div>

                    {problemViewTab === 'problem' && (
                        <>
                            <div className="problem-header">
                                <h1>{problem.name}</h1>
                                <span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
                                <div className="problem-tags">
                                    {problem.tags.map((tag, idx) => (
                                        <span className={`tag ${['easy','medium','hard'].includes(tag.toLowerCase()) ? tag.toLowerCase() : ''}`} key={idx}>{tag}</span>
                                    ))}
                                </div>
                                <div className="problem-limits">
                                    <span>Time: {problem.timeLimit}ms</span>
                                    <span>Memory: {problem.memoryLimit}MB</span>
                                </div>
                            </div>
                            <div className="problem-description">
                                <h2>Description</h2>
                                <pre className="statement">{problem.statement}</pre>
                            </div>
                            {problem.inputFormat && problem.inputFormat.trim() && (
                                <div className="problem-format-section">
                                    <h3 style={{ color: '#00ff66', margin: '16px 0 8px 0' }}>Input Format</h3>
                                    <pre className="format-content">{problem.inputFormat}</pre>
                                </div>
                            )}
                            {problem.outputFormat && problem.outputFormat.trim() && (
                                <div className="problem-format-section">
                                    <h3 style={{ color: '#00ff66', margin: '16px 0 8px 0' }}>Output Format</h3>
                                    <pre className="format-content">{problem.outputFormat}</pre>
                                </div>
                            )}
                            {problem.constraints && problem.constraints.trim() && (
                                <div className="problem-format-section">
                                    <h3 style={{ color: '#00ff66', margin: '16px 0 8px 0' }}>Constraints</h3>
                                    <pre className="format-content">{problem.constraints}</pre>
                                </div>
                            )}
                            {problem.samples && problem.samples.length > 0 && (
                                <div className="sample-testcases-display">
                                    <h3 style={{ color: '#00ff66', margin: '16px 0 8px 0' }}>Sample Test Cases</h3>
                                    {problem.samples.slice(0, 2).map((sample, idx) => (
                                        <div className="sample-testcase-block" key={idx}>
                                            <div className="sample-label">Sample Input {idx + 1}:</div>
                                            <pre className="sample-io">{sample.input}</pre>
                                            <div className="sample-label">Sample Output {idx + 1}:</div>
                                            <pre className="sample-io">{sample.output}</pre>
                                            {sample.explanation && sample.explanation.trim() && (
                                                <div className="sample-label">Explanation:</div>
                                            )}
                                            {sample.explanation && sample.explanation.trim() && (
                                                <pre className="sample-io">{sample.explanation}</pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {problemViewTab === 'submissions' && (
                        <div className="submissions-view">
                            <h2 style={{ color: '#00ff66', marginBottom: 16 }}>My Submissions</h2>
                            {submissionsLoading ? (
                                <p>Loading submissions...</p>
                            ) : submissionsError ? (
                                <p style={{ color: 'red' }}>{submissionsError}</p>
                            ) : submissions.length === 0 ? (
                                <p>You have no submissions for this problem yet.</p>
                            ) : (
                                <table className="submissions-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.7)', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                                    <thead>
                                        <tr style={{ background: '#222', color: '#00ff66' }}>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>#</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Status</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Language</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Time (ms)</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Memory (MB)</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Submitted At</th>
                                            <th style={{ padding: '8px 12px', borderBottom: '2px solid #00ff66' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub, idx) => (
                                            <tr key={sub._id} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '8px 12px', color: '#fff' }}>{submissions.length - idx}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 'bold', color: getStatusColor(sub.status) }}>{sub.status.replace('_', ' ')}</td>
                                                <td style={{ padding: '8px 12px', color: '#fff' }}>{sub.language}</td>
                                                <td style={{ padding: '8px 12px', color: '#fff' }}>
                                                    {sub.executionTime !== undefined && sub.executionTime !== null ? sub.executionTime : '-'}
                                                </td>
                                                <td style={{ padding: '8px 12px', color: '#fff' }}>
                                                    {sub.memoryUsed !== undefined && sub.memoryUsed !== null ? sub.memoryUsed : '-'}
                                                </td>
                                                <td style={{ padding: '8px 12px', color: '#aaa' }}>{new Date(sub.createdAt).toLocaleString()}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <button style={{ background: '#00ff66', color: '#111', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }} onClick={() => setViewCode({ code: sub.code, language: sub.language, createdAt: sub.createdAt })}>
                                                        View Code
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {viewCode && (
                                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewCode(null)}>
                                    <div style={{ background: '#181818', padding: 24, borderRadius: 8, minWidth: 350, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 0 24px #00ff66' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ marginBottom: 12, color: '#00ff66', fontWeight: 'bold' }}>
                                            Submitted on: {new Date(viewCode.createdAt).toLocaleString()}
                                        </div>
                                        <pre style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 6, fontSize: 15, overflowX: 'auto' }}>{viewCode.code}</pre>
                                        <button style={{ marginTop: 16, background: '#00ff66', color: '#111', border: 'none', borderRadius: 4, padding: '6px 18px', cursor: 'pointer', float: 'right' }} onClick={() => setViewCode(null)}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {problemViewTab === 'discussions' && (
                        <div className="discussions-view">
                            <h2>Discussions</h2>
                            {discussionsLoading ? (
                                <p>Loading discussions...</p>
                            ) : discussionsError ? (
                                <p style={{ color: 'red' }}>{discussionsError}</p>
                            ) : (
                                <>
                                    {problem.editorial && problem.editorial.trim() && (
                                        <div className="editorial-section">
                                            <div className="editorial-header">
                                                📝 Editorial by Problem Creator
                                            </div>
                                            <div className="editorial-content">
                                                {problem.editorial}
                                            </div>
                                        </div>
                                    )}
                                    {user && (
                                        <form onSubmit={handlePostDiscussion} style={{ marginBottom: 24 }}>
                                            <textarea
                                                className="discussion-input"
                                                placeholder="Share your solution, approach, or ask a question..."
                                                value={newDiscussion}
                                                onChange={e => setNewDiscussion(e.target.value)}
                                                rows={3}
                                                style={{ width: '100%', borderRadius: 6, padding: 10, fontSize: 15, resize: 'vertical', marginBottom: 8 }}
                                                disabled={postingDiscussion}
                                            />
                                            <button
                                                type="submit"
                                                className={`post-btn ${problem.difficulty}`}
                                                disabled={postingDiscussion || !newDiscussion.trim()}
                                            >
                                                {postingDiscussion ? 'Posting...' : 'Post'}
                                            </button>
                                            <div style={{ clear: 'both' }}></div>
                                        </form>
                                    )}
                                    {discussions.length === 0 ? (
                                        <p>No discussions for this problem yet.</p>
                                    ) : (
                                        <div className="discussion-list">
                                            {discussions.map((d, idx) => {
                                                const badge = d.userId?.badge || 'Code Novice';
                                                const usernameColor = badgeColors[badge] || '#00FF00';
                                                return (
                                                    <div key={d._id || idx} className="discussion-item" style={{ background: '#181818', borderRadius: 8, padding: 16, marginBottom: 16, boxShadow: '0 0 8px #222' }}>
                                                        <div style={{ marginBottom: 8, fontWeight: 'bold', color: usernameColor }}>
                                                            {d.userId?.username || d.userId?.firstname || 'User'}
                                                            <span style={{ color: '#aaa', fontWeight: 'normal', marginLeft: 12, fontSize: 13 }}>
                                                                {d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}
                                                            </span>
                                                        </div>
                                                        <div style={{ color: '#fff', fontSize: 15, whiteSpace: 'pre-wrap' }}>{d.content}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="solve-problem-right">
                    <div className="editor-section">
                        <div className="editor-header">
                            <label>Language: </label>
                            <div className="language-select-container">
                                <div className="language-select-wrapper">
                                    <select className="language-select" value={language} onChange={handleLanguageChange}>
                                        <option value="python">Python</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">Java</option>
                                    </select>
                                </div>
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
                                value={editorCode}
                                onChange={e => setEditorCode(e.target.value)}
                                onKeyDown={handleCodeKeyDown}
                                rows={14}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                    </div>
                    
                    {/* AI Review Section */}
                    <div className="testcase-section" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: '#00ff66', marginBottom: '1rem' }}>🤖 AI Assistant</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button
                                className={`ai-tab-btn ${activeAiTab === 'review' ? 'active' : ''}`}
                                onClick={() => setActiveAiTab('review')}
                                disabled={isAiLoading}
                                style={{
                                    background: activeAiTab === 'review' ? '#00ff66' : 'transparent',
                                    color: activeAiTab === 'review' ? '#000' : '#00ff66',
                                    border: '1px solid #00ff66',
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
                                    background: activeAiTab === 'explain' ? '#00ff66' : 'transparent',
                                    color: activeAiTab === 'explain' ? '#000' : '#00ff66',
                                    border: '1px solid #00ff66',
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
                                    background: activeAiTab === 'optimize' ? '#00ff66' : 'transparent',
                                    color: activeAiTab === 'optimize' ? '#000' : '#00ff66',
                                    border: '1px solid #00ff66',
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
                                    disabled={isAiLoading || !editorCode.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff66',
                                        border: '1px solid #00ff66',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !editorCode.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !editorCode.trim() ? 0.5 : 1,
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
                                    disabled={isAiLoading || !editorCode.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff66',
                                        border: '1px solid #00ff66',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !editorCode.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !editorCode.trim() ? 0.5 : 1,
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
                                    disabled={isAiLoading || !editorCode.trim()}
                                    style={{
                                        background: 'transparent',
                                        color: '#00ff66',
                                        border: '1px solid #00ff66',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        cursor: isAiLoading || !editorCode.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isAiLoading || !editorCode.trim() ? 0.5 : 1,
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
                                    color: '#00ff66',
                                    border: '1px solid #00ff66',
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
                                    color: '#00ff66',
                                    border: '1px solid #00ff66',
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
                                    color: '#00ff66',
                                    border: '1px solid #00ff66',
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
                    
                    <div className="testcase-section">
                        <div className="button-group">
                            <button className="run-btn" onClick={handleRun} disabled={runLoading}>
                                {runLoading ? 'Running...' : 'Run'}
                            </button>
                            <button className={`submit-btn ${problem.difficulty}`} onClick={handleSubmit}>Submit</button>
                        </div>
                        <div className="problem-view-nav">
                            <button
                                className={`problem-view-nav-item ${testOutputTab === 'testcase' ? 'active' : ''}`}
                                onClick={() => setTestOutputTab('testcase')}>
                                Test Case
                            </button>
                            <button
                                className={`problem-view-nav-item ${testOutputTab === 'output' ? 'active' : ''}`}
                                onClick={() => setTestOutputTab('output')}>
                                Output
                            </button>
                        </div>
                        {testOutputTab === 'testcase' && (
                            <textarea
                                className="input-area"
                                placeholder="Custom Input..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                rows={5}
                            />
                        )}
                        {testOutputTab === 'output' && (
                            <textarea
                                className="output-area"
                                placeholder="Output..."
                                value={output}
                                readOnly
                                rows={5}
                            />
                        )}
                        {submissionMeta && (
                            <div style={{ marginBottom: 10, color: '#00ff66', fontWeight: 500, textAlign: 'center' }}>
                                {submissionMeta.executionTime !== undefined && (
                                    <span>Total Execution Time: {submissionMeta.executionTime} ms</span>
                                )}
                                {submissionMeta.memoryUsed !== undefined && (
                                    <span style={{ marginLeft: 24 }}>Total Memory Used: {submissionMeta.memoryUsed} MB</span>
                                )}
                            </div>
                        )}
                        {testCaseResults && Array.isArray(testCaseResults) && testCaseResults.length > 0 && (
                            <div className="testcase-analysis-container">
                                <h3 style={{ color: '#00ff66', marginBottom: 8, textAlign: 'center' }}>Test Case Analysis</h3>
                                <table className="testcase-analysis-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Input</th>
                                            <th>Expected Output</th>
                                            <th>Your Output</th>
                                            <th>Result</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testCaseResults.map((tc, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{tc.input}</td>
                                                <td style={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{tc.expectedOutput}</td>
                                                <td style={{ whiteSpace: 'pre-wrap', maxWidth: 200 }}>{tc.userOutput}</td>
                                                <td style={{ fontWeight: 'bold', color: tc.isCorrect ? '#00ff66' : '#ff4444' }}>{tc.isCorrect ? 'Correct' : 'Wrong'}</td>
                                                <td style={{ color: tc.error ? '#ff4444' : '#aaa', maxWidth: 200 }}>
                                                    {tc.error && tc.error.length > 30 ? (
                                                        <span style={{ cursor: 'pointer', color: '#00ff66', textDecoration: 'underline' }} onClick={() => setErrorModal(tc.error)}>View</span>
                                                    ) : (tc.error || '-')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: 12, color: testCaseResults.every(tc => tc.isCorrect) ? '#00ff66' : '#ff4444', fontWeight: 600, fontSize: 17, textAlign: 'center' }}>
                                    Final Verdict: {testCaseResults.every(tc => tc.isCorrect) ? 'Accepted' : `Wrong Answer`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {errorModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setErrorModal(null)}>
                    <div style={{ background: '#181818', padding: 24, borderRadius: 8, minWidth: 350, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 0 24px #00ff66' }} onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: 12, color: '#00ff66', fontWeight: 'bold', fontSize: 18 }}>Error Message</div>
                        <pre style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 6, fontSize: 15, overflowX: 'auto' }}>{errorModal}</pre>
                        <button style={{ marginTop: 16, background: '#00ff66', color: '#111', border: 'none', borderRadius: 4, padding: '6px 18px', cursor: 'pointer', float: 'right' }} onClick={() => setErrorModal(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolveProblem;