// mcp-server.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Config
const PORT = process.env.PORT || 3000;
const MCP_BIND = process.env.MCP_BIND || '127.0.0.1';
const MCP_API_KEY = process.env.MCP_API_KEY || null;

const jobs = new Map(); // id -> { status, startedAt, finishedAt, exitCode, pid }

const MCP_DATA_DIR = './mcp_data';

// Ensure mcp_data exists
if (!fs.existsSync(MCP_DATA_DIR)) {
  fs.mkdirSync(MCP_DATA_DIR, { recursive: true });
}

// constant-time comparison helper to avoid timing attacks
function safeEquals(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

// Extract provided key from request (header, Authorization, or query param)
function extractProvidedKey(req) {
  // 1. X-MCP-KEY header
  const header = req.headers['x-mcp-key'];
  if (header) return header;

  // 2. Authorization header (supports "Bearer <token>" or raw token)
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (auth) {
    const parts = String(auth).split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
    return auth;
  }

  // 3. query param ?key=
  if (req.query && req.query.key) return req.query.key;

  return null;
}

// Middleware for API key (placed early)
app.use((req, res, next) => {
  if (!MCP_API_KEY) {
    console.warn('MCP_API_KEY not set — server accepting all requests (insecure). To require a key set MCP_API_KEY.');
    return next();
  }

  const provided = extractProvidedKey(req);
  if (!provided) {
    // Do not log the token itself; only log metadata of the attempt
    console.warn(`Unauthorized request: no API key provided — ip=${req.ip} route=${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized - missing API key' });
  }

  if (!safeEquals(provided, MCP_API_KEY)) {
    console.warn(`Unauthorized request: invalid API key — ip=${req.ip} route=${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized - invalid API key' });
  }

  return next();
});

// POST /trigger
app.post('/trigger', (req, res) => {
  const id = uuidv4();
  const jobDir = path.join(MCP_DATA_DIR, id);
  fs.mkdirSync(jobDir, { recursive: true });
  const logPath = path.join(jobDir, 'run.log');
  const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });

  jobs.set(id, { status: 'queued', startedAt: new Date().toISOString(), pid: null });

  // Spawn ci.ps1 using pwsh first, fallback to powershell.exe on error
  const scriptFullPath = path.resolve('./ci.ps1');
  let child = null;
  let spawned = false;

  function hookupChild(c) {
    if (c && c.pid) {
      jobs.get(id).status = 'running';
      jobs.get(id).pid = c.pid;
    }

    // Pipe outputs
    if (c.stdout) c.stdout.pipe(logStream, { end: false });
    if (c.stderr) c.stderr.pipe(logStream, { end: false });

    c.on('error', (err) => {
      logStream.write(`Process error: ${String(err)}\n`);
    });

    c.on('exit', (code) => {
      jobs.get(id).status = code === 0 ? 'success' : 'failed';
      jobs.get(id).finishedAt = new Date().toISOString();
      jobs.get(id).exitCode = code;
      logStream.write(`\nPROCESS EXIT CODE: ${code}\n`);
      logStream.end();

      // Copy artifacts if exists
      const artifactsSrc = path.resolve('./artifacts');
      const artifactsDest = path.join(jobDir, 'artifacts');
      if (fs.existsSync(artifactsSrc)) {
        fs.mkdirSync(artifactsDest, { recursive: true });
        copyDir(artifactsSrc, artifactsDest);
      }
    });
  }

  // Try to spawn PowerShell process
  function trySpawnPowerShell() {
    // First try pwsh (PowerShell Core)
    try {
      child = spawn('pwsh', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFullPath], { 
        cwd: process.cwd(), 
        windowsHide: true 
      });
      
      child.on('error', (err) => {
        console.log('pwsh not available, trying powershell.exe...');
        trySpawnWindowsPowerShell();
      });
      
      if (child.pid) {
        spawned = true;
        hookupChild(child);
        return true;
      }
    } catch (err) {
      console.log('pwsh spawn failed, trying powershell.exe...');
    }
    
    return false;
  }

  function trySpawnWindowsPowerShell() {
    try {
      child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFullPath], { 
        cwd: process.cwd(), 
        windowsHide: true 
      });
      
      child.on('error', (err) => {
        console.log('powershell.exe spawn failed:', err.message);
        markJobFailed();
      });
      
      if (child.pid) {
        spawned = true;
        hookupChild(child);
        return true;
      }
    } catch (err) {
      console.log('powershell.exe spawn failed:', err.message);
    }
    
    return false;
  }

  function markJobFailed() {
    jobs.get(id).status = 'failed';
    jobs.get(id).finishedAt = new Date().toISOString();
    jobs.get(id).exitCode = -1;
    logStream.write('Failed to spawn PowerShell (pwsh and powershell.exe attempts failed)\n');
    logStream.write('Make sure PowerShell is available in the system PATH\n');
    logStream.end();
  }

  // Try to spawn PowerShell
  if (!trySpawnPowerShell()) {
    if (!trySpawnWindowsPowerShell()) {
      markJobFailed();
      return res.json({ id, statusUrl: `/status/${id}`, logsUrl: `/logs/${id}`, artifactUrl: `/artifact/${id}/` });
    }
  }

  res.json({ id, statusUrl: `/status/${id}`, logsUrl: `/logs/${id}`, artifactUrl: `/artifact/${id}/` });
});

// GET /status/:id
app.get('/status/:id', (req, res) => {
  const id = req.params.id;
  const job = jobs.get(id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json({
    id,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    exitCode: job.exitCode,
    pid: job.pid
  });
});

// GET /logs/:id
app.get('/logs/:id', (req, res) => {
  const id = req.params.id;
  const logPath = path.join(MCP_DATA_DIR, id, 'run.log');
  if (!fs.existsSync(logPath)) {
    return res.status(404).send('Log not found');
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  fs.createReadStream(logPath).pipe(res);
});

// GET /artifact/:id/*
app.get('/artifact/:id/*', (req, res) => {
  const id = req.params.id;
  const file = req.params[0];
  const artifactPath = path.join(MCP_DATA_DIR, id, 'artifacts', file || '');
  if (!fs.existsSync(artifactPath)) {
    return res.status(404).send('Artifact not found');
  }
  res.sendFile(path.resolve(artifactPath));
});

app.listen(PORT, MCP_BIND, () => {
  console.log(`MCP server running on http://${MCP_BIND}:${PORT}`);
  if (!MCP_API_KEY) {
    console.warn('MCP_API_KEY not set — server accepting all requests (insecure). To require a key set MCP_API_KEY environment variable.');
  } else {
    console.log('MCP_API_KEY is set — incoming requests require a valid API key.');
  }
});

// Helper to copy directory
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
