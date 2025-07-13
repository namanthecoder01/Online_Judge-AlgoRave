import { execSync } from "child_process";

console.log('Testing WMIC command for memory monitoring...');

// Test 1: Check if we can get our own process memory
try {
    console.log('\\n1. Testing WMIC on current process:');
    const result1 = execSync(`wmic process where "ProcessId=${process.pid}" get WorkingSetSize /format:value`, { encoding: 'utf8' });
    console.log('Result:', result1);
    
    const match1 = result1.match(/WorkingSetSize=(\\d+)/);
    if (match1) {
        const memoryBytes = parseInt(match1[1]);
        const memoryKB = memoryBytes / 1024;
        const memoryMB = +(memoryKB / 1024).toFixed(2);
        console.log(`Memory: ${memoryBytes} bytes = ${memoryKB} KB = ${memoryMB} MB`);
    } else {
        console.log('No memory data found');
    }
} catch (err) {
    console.error('Error:', err.message);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
}

// Test 2: Try a different WMIC format
try {
    console.log('\\n2. Testing WMIC with different format:');
    const result2 = execSync(`wmic process where "ProcessId=${process.pid}" get WorkingSetSize`, { encoding: 'utf8' });
    console.log('Result:', result2);
} catch (err) {
    console.error('Error:', err.message);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
}

// Test 3: Try with quotes around ProcessId
try {
    console.log('\\n3. Testing WMIC with quoted ProcessId:');
    const result3 = execSync(`wmic process where "ProcessId='${process.pid}'" get WorkingSetSize /format:value`, { encoding: 'utf8' });
    console.log('Result:', result3);
} catch (err) {
    console.error('Error:', err.message);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
}

// Test 4: Try without 2>nul
try {
    console.log('\\n4. Testing WMIC without 2>nul:');
    const result4 = execSync(`wmic process where "ProcessId=${process.pid}" get WorkingSetSize /format:value`, { encoding: 'utf8' });
    console.log('Result:', result4);
} catch (err) {
    console.error('Error:', err.message);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
} 