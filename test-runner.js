const http = require('node:http');
const { spawn } = require('node:child_process');

async function testApp() {
  // Start the server
  const server = spawn('node', ['test-app.js'], { cwd: process.cwd() });
  
  server.stdout.on('data', d => console.log('[server]', d.toString().trim()));
  server.stderr.on('data', d => console.error('[server err]', d.toString().trim()));
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 1500));
  
  // Test endpoints
  for (const path of ['/health', '/']) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get('http://localhost:3000' + path, resolve).on('error', reject);
      });
      let data = '';
      for await (const chunk of res) data += chunk;
      console.log(`GET ${path} -> ${res.statusCode}: ${data}`);
    } catch (e) {
      console.error(`GET ${path} failed:`, e.message);
    }
  }
  
  server.kill();
}

testApp();