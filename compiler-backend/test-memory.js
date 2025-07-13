import { execSync } from "child_process";

// Test memory monitoring on Windows
const testMemoryMonitoring = () => {
    console.log('Testing memory monitoring on Windows...');
    
    try {
        // Test WMIC command
        const result = execSync(`wmic process where "ProcessId=${process.pid}" get WorkingSetSize /format:value 2>nul`, { encoding: 'utf8' });
        console.log('WMIC result:', result);
        
        const match = result.match(/WorkingSetSize=(\d+)/);
        if (match) {
            const memoryBytes = parseInt(match[1]);
            const memoryKB = memoryBytes / 1024;
            const memoryMB = +(memoryKB / 1024).toFixed(2);
            console.log(`Memory: ${memoryBytes} bytes = ${memoryKB} KB = ${memoryMB} MB`);
        } else {
            console.log('No memory data found in WMIC output');
        }
    } catch (err) {
        console.error('WMIC error:', err.message);
        if (err.stdout) console.log('stdout:', err.stdout);
        if (err.stderr) console.log('stderr:', err.stderr);
    }
};

testMemoryMonitoring(); 