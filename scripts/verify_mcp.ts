import { spawn } from 'child_process';
import path from 'path';

// POINT TO THE COMPILED JS to match what we told the user to use
const serverPath = path.join(process.cwd(), 'dist/src/mcp/server.js');
console.log(`Testing MCP Server at: ${serverPath}`);

const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env
});

// Simulate Cline calling the tool
const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'generate_project',
        arguments: {
            name: 'auto-test-kestra-link',
            db: 'postgresql',
            prompt: 'A test project to verify MCP to Kestra link'
        }
    }
};

child.stdout.on('data', (data) => {
    console.log(`\n--- MCP RESPONSE ---`);
    console.log(data.toString());
    console.log(`--------------------\n`);
    // Exit if we got a real result (not just debug logs)
    if (data.toString().includes('jsonrpc')) {
        child.kill();
    }
});

if (child.stderr) {
    child.stderr.on('data', (data: any) => {
        console.error(`[SERVER LOG]: ${data.toString()}`);
    });
}

console.log('Sending Request in 2 seconds...');
setTimeout(() => {
    child.stdin.write(JSON.stringify(request) + '\n');
}, 2000);
