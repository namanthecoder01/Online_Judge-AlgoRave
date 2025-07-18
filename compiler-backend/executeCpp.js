import { exec, spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = (filepath, input = "", timeLimit = 5000, memoryLimit = 256) => {
    const jobId = path.basename(filepath).split(".")[0];
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject) => {
        exec(`g++ ${filepath} -o ${outPath}`, (compileErr, stdout, stderr) => {
            if (compileErr) {
                return reject({ error: stderr || compileErr.message, memoryUsed: 0, execTime: 0, status: 'compilation_error' });
            }
            let output = "";
            let error = "";
            let maxMemoryUsage = 0;
            const start = process.hrtime.bigint();

            if (process.platform === 'linux') {
                // Use /usr/bin/time -v to get peak memory usage
                const timeCmd = `/usr/bin/time -v ${outPath}`;
                const runProcess = spawn('/usr/bin/time', ['-v', outPath], { cwd: outputPath });
                let timeStderr = "";
                runProcess.stdin.write(input);
                runProcess.stdin.end();
                runProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                runProcess.stderr.on('data', (data) => {
                    timeStderr += data.toString();
                });
                runProcess.on('close', (code) => {
                    const end = process.hrtime.bigint();
                    const execTime = Number(end - start) / 1000000; // ms
                    // Parse peak memory from timeStderr
                    const match = timeStderr.match(/Maximum resident set size \(kbytes\):\s*(\d+)/);
                    if (match) {
                        maxMemoryUsage = parseInt(match[1]); // in KB
                    }
                    if (code !== 0) {
                        return reject({ error: error || `Process exited with code ${code}`, memoryUsed: maxMemoryUsage, execTime });
                    }
                    // Check memory limit (convert MB to KB)
                    if (maxMemoryUsage > memoryLimit * 1024) {
                        return reject({ error: 'Memory limit exceeded', memoryUsed: maxMemoryUsage, execTime: 0, status: 'memory_limit_exceeded' });
                    }
                    resolve({ output, memoryUsed: maxMemoryUsage, execTime });
                });
                runProcess.on('error', (err) => {
                    const end = process.hrtime.bigint();
                    const execTime = Number(end - start) / 1000000;
                    reject({ error: err.message, memoryUsed: maxMemoryUsage, execTime });
                });
            } else {
                const runProcess = spawn(outPath, [], { cwd: outputPath });
                let output = "";
                let error = "";
                let maxMemoryUsage = 0;
                const start = process.hrtime.bigint();
                
                const checkMemory = () => {
                    try {
                        let memoryKB = 0;
                        if (process.platform === 'win32') {
                            let result = '';
                            try {
                                result = execSync(`wmic process where \"ProcessId=${runProcess.pid}\" get WorkingSetSize /format:value 2>nul`, { encoding: 'utf8' });
                            } catch (err) {
                                // Ignore 'No Instance(s) Available.' and other wmic errors
                                if (err.stdout && err.stdout.includes('No Instance(s) Available.')) return;
                                if (err.stderr && err.stderr.includes('No Instance(s) Available.')) return;
                                // For other wmic errors, just return without updating memory
                                return;
                            }
                            const match = result.match(/WorkingSetSize=(\d+)/);
                            if (match) memoryKB = parseInt(match[1]) / 1024;
                        } else if (process.platform === 'linux') {
                            try {
                                const result = execSync(`ps -p ${runProcess.pid} -o rss=`, { encoding: 'utf8' });
                                memoryKB = parseInt(result.trim()) || 0;
                            } catch (err) {
                                const result = execSync(`cat /proc/${runProcess.pid}/status | grep VmRSS`, { encoding: 'utf8' });
                                const match = result.match(/VmRSS:\s+(\d+)/);
                                if (match) memoryKB = parseInt(match[1]);
                            }
                        } else if (process.platform === 'darwin') {
                            const result = execSync(`ps -p ${runProcess.pid} -o rss=`, { encoding: 'utf8' });
                            memoryKB = parseInt(result.trim()) || 0;
                        }
                        
                        // Log memory values for debugging
                        console.log(`Memory check - PID: ${runProcess.pid}, Memory: ${memoryKB} KB, Max so far: ${maxMemoryUsage} KB`);
                        
                        maxMemoryUsage = Math.max(maxMemoryUsage, memoryKB);
                        
                        // Check memory limit (convert MB to KB)
                        if (maxMemoryUsage > memoryLimit * 1024) {
                            clearTimeout(timeout);
                            clearInterval(memoryMonitor);
                            runProcess.kill('SIGKILL');
                            reject({ error: 'Memory limit exceeded', memoryUsed: maxMemoryUsage, execTime: 0, status: 'memory_limit_exceeded' });
                        }
                    } catch (err) {
                        // Ignore all monitoring errors silently
                        console.log('Memory check error:', err.message);
                    }
                };
                
                // Set timeout for the process
                const timeout = setTimeout(() => {
                    runProcess.kill('SIGKILL');
                    reject({ error: 'Time limit exceeded', memoryUsed: maxMemoryUsage, execTime: timeLimit, status: 'time_limit_exceeded' });
                }, timeLimit);
                
                // Check memory immediately after process starts
                setTimeout(checkMemory, 10);
                
                // Monitor memory usage more frequently
                const memoryMonitor = setInterval(checkMemory, 10); // Changed from 50ms to 10ms
                
                runProcess.on('close', () => {
                    clearInterval(memoryMonitor);
                });
                
                runProcess.on('close', (code) => {
                    clearTimeout(timeout);
                    clearInterval(memoryMonitor);
                    // Final memory check
                    checkMemory();
                    const end = process.hrtime.bigint();
                    const execTime = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds
                    if (code !== 0) {
                        return reject({ error: error || `Process exited with code ${code}`, memoryUsed: maxMemoryUsage, execTime });
                    }
                    resolve({ output, memoryUsed: maxMemoryUsage, execTime });
                });
                runProcess.on('error', (err) => {
                    clearTimeout(timeout);
                    clearInterval(memoryMonitor);
                    const end = process.hrtime.bigint();
                    const execTime = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds
                    reject({ error: err.message, memoryUsed: maxMemoryUsage, execTime });
                });
                
                runProcess.stdin.write(input);
                runProcess.stdin.end();
                runProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                runProcess.stderr.on('data', (data) => {
                    error += data.toString();
                });
            }
        });
    });
};

export { executeCpp };