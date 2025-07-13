import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

// Create a simple C++ program that uses some memory
const cppCode = `
#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Allocate some memory to make it measurable
    vector<int> v;
    for(int i = 0; i < 100000; i++) {
        v.push_back(i);
    }
    
    cout << "Hello World! Allocated " << v.size() << " integers." << endl;
    return 0;
}`;

const testFile = path.join(outputPath, "test.cpp");
fs.writeFileSync(testFile, cppCode);

console.log('Testing memory monitoring with a C++ program that allocates memory...');

try {
    // Compile the test program
    execSync(`g++ ${testFile} -o ${path.join(outputPath, "test.exe")}`);
    console.log('Compilation successful');
    
    // Run the program and monitor its memory
    const { spawn } = await import('child_process');
    const runProcess = spawn(path.join(outputPath, "test.exe"), [], { cwd: outputPath });
    
    let maxMemoryUsage = 0;
    const checkMemory = () => {
        try {
            let memoryKB = 0;
            if (process.platform === 'win32') {
                try {
                    const result = execSync(`wmic process where "ProcessId=${runProcess.pid}" get WorkingSetSize /format:value 2>nul`, { encoding: 'utf8' });
                    const match = result.match(/WorkingSetSize=(\\d+)/);
                    if (match) {
                        memoryKB = parseInt(match[1]) / 1024;
                        console.log(`Current memory: ${memoryKB} KB`);
                    }
                } catch (err) {
                    console.log('WMIC error:', err.message);
                }
            }
            maxMemoryUsage = Math.max(maxMemoryUsage, memoryKB);
        } catch (err) {
            console.log('Memory check error:', err.message);
        }
    };
    
    // Check memory every 100ms
    const memoryInterval = setInterval(checkMemory, 100);
    
    // Wait for process to complete
    runProcess.on('close', (code) => {
        clearInterval(memoryInterval);
        checkMemory(); // Final check
        console.log(`Process exited with code ${code}`);
        console.log(`Max memory used: ${maxMemoryUsage} KB = ${+(maxMemoryUsage / 1024).toFixed(2)} MB`);
    });
    
    runProcess.stdout.on('data', (data) => {
        console.log('Output:', data.toString());
    });
    
    runProcess.stderr.on('data', (data) => {
        console.log('Error:', data.toString());
    });
    
} catch (error) {
    console.error('Test failed:', error.message);
} 