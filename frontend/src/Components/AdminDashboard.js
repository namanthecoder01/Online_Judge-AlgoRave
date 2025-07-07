import React, { useState } from 'react';
import './AdminDashboard.css';
import { BACKEND_URL } from '../utils/apiEndpoints';

const TABS = ['Add Problem', 'Add Test Case', 'Add Contest'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [problemForm, setProblemForm] = useState({
    name: '',
    code: '',
    statement: '',
    tags: '',
    difficulty: '',
    memoryLimit: '',
    timeLimit: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    editorial: '',
    isPublished: false,
    sample1Input: '',
    sample1Output: '',
    sample1Explanation: '',
    sample2Input: '',
    sample2Output: '',
    sample2Explanation: ''
  });
  const [testCaseForm, setTestCaseForm] = useState({ problemId: '', input: '', output: '' });
  const contestInitialState = {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    problems: '',
    difficulty: '',
    type: '',
    prizes: ''
  };
  const [contestForm, setContestForm] = useState(contestInitialState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleTab = idx => {
    setActiveTab(idx);
    setMessage('');
    setError('');
  };

  const handleChange = (form, setForm) => e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProblemSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate timeLimit and memoryLimit
    if (!problemForm.timeLimit || isNaN(Number(problemForm.timeLimit)) || Number(problemForm.timeLimit) <= 0) {
      setError('Time Limit is required and must be a positive number.');
      return;
    }
    if (!problemForm.memoryLimit || isNaN(Number(problemForm.memoryLimit)) || Number(problemForm.memoryLimit) <= 0) {
      setError('Memory Limit is required and must be a positive number.');
      return;
    }

    // Collect up to 2 sample test cases
    const sampleTestCasesArr = [];
    if (problemForm.sample1Input && problemForm.sample1Output) {
      sampleTestCasesArr.push({
        input: problemForm.sample1Input,
        output: problemForm.sample1Output,
        explanation: problemForm.sample1Explanation || ''
      });
    }
    if (problemForm.sample2Input && problemForm.sample2Output) {
      sampleTestCasesArr.push({
        input: problemForm.sample2Input,
        output: problemForm.sample2Output,
        explanation: problemForm.sample2Explanation || ''
      });
    }
    if (sampleTestCasesArr.length > 2) {
      setError('You can add at most 2 sample test cases.');
      return;
    }

    try {
      const requestBody = {
        ...problemForm,
        memoryLimit: Number(problemForm.memoryLimit),
        timeLimit: Number(problemForm.timeLimit),
        tags: problemForm.tags.split(',').map(t => t.trim()),
        sampleTestCases: sampleTestCasesArr,
        inputFormat: problemForm.inputFormat,
        outputFormat: problemForm.outputFormat,
        constraints: problemForm.constraints,
        editorial: problemForm.editorial,
        isPublished: problemForm.isPublished
      };
      
      const res = await fetch(`${BACKEND_URL}/admin/problem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();
      if (data.success) setMessage('Problem added!');
      else setError(data.message || 'Failed to add problem');
    } catch (err) {
      setError('Failed to add problem');
    }
  };

  const handleTestCaseSubmit = async e => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/admin/testcase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify(testCaseForm)
      });
      const data = await res.json();
      if (data.success) setMessage('Test case added!');
      else setError(data.message || 'Failed to add test case');
    } catch (err) { setError('Failed to add test case'); }
  };

  const handleContestSubmit = async e => {
    e.preventDefault();
    setMessage(''); setError('');
    // Validation
    if (!contestForm.title || !contestForm.description || contestForm.description.length < 10 || !contestForm.startTime || !contestForm.endTime || !contestForm.problems || !contestForm.difficulty || !contestForm.type || !contestForm.prizes) {
      setError('All fields are required and description must be at least 10 characters.');
      return;
    }
    const start = new Date(contestForm.startTime);
    const end = new Date(contestForm.endTime);
    if (isNaN(start) || isNaN(end) || end <= start) {
      setError('Invalid start or end time.');
      return;
    }
    const durationMinutes = Math.round((end - start) / 60000);
    if (durationMinutes < 10) {
      setError('Duration must be at least 10 minutes.');
      return;
    }
    const problemsArr = contestForm.problems.split(',').map(p => p.trim()).filter(Boolean);
    const prizesArr = contestForm.prizes.split(',').map(p => p.trim()).filter(Boolean);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/contest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
        },
        body: JSON.stringify({
          title: contestForm.title,
          description: contestForm.description,
          startTime: contestForm.startTime,
          endTime: contestForm.endTime,
          problems: problemsArr,
          difficulty: contestForm.difficulty,
          type: contestForm.type,
          prizes: prizesArr
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Contest added!');
        setContestForm(contestInitialState);
      } else setError(data.message || 'Failed to add contest');
    } catch (err) { setError('Failed to add contest'); }
  };

  return (
    <div className="admin-dashboard-container oj-dashboard oj-hacker-theme">
      <h2 className="admin-title">Admin Dashboard</h2>
      <div className="admin-tabs">
        {TABS.map((tab, idx) => (
          <button key={tab} className={activeTab === idx ? 'active' : ''} onClick={() => handleTab(idx)}>{tab}</button>
        ))}
      </div>
      <div className="admin-tab-content">
        {activeTab === 0 && (
          <form className="admin-form" onSubmit={handleProblemSubmit} autoComplete="off">
            <div className="admin-form-row">
              <input name="name" placeholder="Problem Name" value={problemForm.name} onChange={handleChange(problemForm, setProblemForm)} required />
              <input name="code" placeholder="Problem Code" value={problemForm.code} onChange={handleChange(problemForm, setProblemForm)} required />
            </div>
            <textarea name="statement" placeholder="Statement (min 10 chars)" value={problemForm.statement} onChange={handleChange(problemForm, setProblemForm)} required minLength={10} />
            <div className="admin-form-row">
              <input name="tags" placeholder="Tags (comma separated)" value={problemForm.tags} onChange={handleChange(problemForm, setProblemForm)} />
              <input name="difficulty" placeholder="Difficulty (Easy/Medium/Hard)" value={problemForm.difficulty} onChange={handleChange(problemForm, setProblemForm)} />
            </div>
            <textarea name="inputFormat" placeholder="Input Format (optional)" value={problemForm.inputFormat} onChange={handleChange(problemForm, setProblemForm)} />
            <textarea name="outputFormat" placeholder="Output Format (optional)" value={problemForm.outputFormat} onChange={handleChange(problemForm, setProblemForm)} />
            <textarea name="constraints" placeholder="Constraints (optional)" value={problemForm.constraints} onChange={handleChange(problemForm, setProblemForm)} />
            <textarea name="editorial" placeholder="Editorial/Solution Explanation (optional)" value={problemForm.editorial} onChange={handleChange(problemForm, setProblemForm)} />
            <div className="admin-form-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <input 
                  type="checkbox" 
                  name="isPublished" 
                  checked={problemForm.isPublished} 
                  onChange={handleChange(problemForm, setProblemForm)} 
                />
                Publish Problem (show on frontend)
              </label>
            </div>
            <div className="sample-testcase-section">
              <h4>Sample Test Case 1 (optional)</h4>
              <textarea name="sample1Input" placeholder="Sample Input 1" value={problemForm.sample1Input} onChange={handleChange(problemForm, setProblemForm)} />
              <textarea name="sample1Output" placeholder="Sample Output 1" value={problemForm.sample1Output} onChange={handleChange(problemForm, setProblemForm)} />
              <input name="sample1Explanation" placeholder="Sample Explanation 1 (optional)" value={problemForm.sample1Explanation} onChange={handleChange(problemForm, setProblemForm)} />
              <h4>Sample Test Case 2 (optional)</h4>
              <textarea name="sample2Input" placeholder="Sample Input 2" value={problemForm.sample2Input} onChange={handleChange(problemForm, setProblemForm)} />
              <textarea name="sample2Output" placeholder="Sample Output 2" value={problemForm.sample2Output} onChange={handleChange(problemForm, setProblemForm)} />
              <input name="sample2Explanation" placeholder="Sample Explanation 2 (optional)" value={problemForm.sample2Explanation} onChange={handleChange(problemForm, setProblemForm)} />
            </div>
            <div className="admin-form-row">
              <input name="memoryLimit" placeholder="Memory Limit (e.g. 256)" value={problemForm.memoryLimit} onChange={handleChange(problemForm, setProblemForm)} required />
              <input name="timeLimit" placeholder="Time Limit (e.g. 2)" value={problemForm.timeLimit} onChange={handleChange(problemForm, setProblemForm)} required />
            </div>
            <button className="admin-submit-btn" type="submit">Add Problem</button>
          </form>
        )}
        {activeTab === 1 && (
          <form className="admin-form" onSubmit={handleTestCaseSubmit} autoComplete="off">
            <input name="problemId" placeholder="Problem ID" value={testCaseForm.problemId} onChange={handleChange(testCaseForm, setTestCaseForm)} required />
            <textarea name="input" placeholder="Input" value={testCaseForm.input} onChange={handleChange(testCaseForm, setTestCaseForm)} required />
            <textarea name="output" placeholder="Output" value={testCaseForm.output} onChange={handleChange(testCaseForm, setTestCaseForm)} required />
            <button className="admin-submit-btn" type="submit">Add Test Case</button>
          </form>
        )}
        {activeTab === 2 && (
          <form className="admin-form" onSubmit={handleContestSubmit} autoComplete="off">
            <input name="title" placeholder="Contest Title" value={contestForm.title} onChange={handleChange(contestForm, setContestForm)} required />
            <textarea name="description" placeholder="Description (min 10 chars)" value={contestForm.description} onChange={handleChange(contestForm, setContestForm)} minLength={10} required />
            <div className="admin-form-row">
              <input name="startTime" type="datetime-local" placeholder="Start Time" value={contestForm.startTime} onChange={handleChange(contestForm, setContestForm)} required />
              <input name="endTime" type="datetime-local" placeholder="End Time" value={contestForm.endTime} onChange={handleChange(contestForm, setContestForm)} required />
            </div>
            <input name="problems" placeholder="Problem Codes or IDs (comma separated)" value={contestForm.problems} onChange={handleChange(contestForm, setContestForm)} required />
            <div className="admin-form-row">
              <input name="difficulty" placeholder="Difficulty (easy/medium/hard)" value={contestForm.difficulty} onChange={handleChange(contestForm, setContestForm)} required />
              <input name="type" placeholder="Type (rated/practice)" value={contestForm.type} onChange={handleChange(contestForm, setContestForm)} required />
            </div>
            <input name="prizes" placeholder="Prizes (comma separated)" value={contestForm.prizes} onChange={handleChange(contestForm, setContestForm)} required />
            <button className="admin-submit-btn" type="submit">Add Contest</button>
          </form>
        )}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;