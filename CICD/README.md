# Local CI/CD Orchestrator

This is a simple MCP-style local CI/CD orchestrator for Windows-based Node projects.

## Setup

1. Install dependencies: `npm install`

2. Start the MCP server: `npm run start:mcp` or `node mcp-server.js`

   The server runs on http://127.0.0.1:3000

## Usage

1. Trigger a CI run: `curl -X POST http://localhost:3000/trigger`

   Response includes `id`, `statusUrl`, `logsUrl`, `artifactUrl`

2. Check status: `curl http://localhost:3000/status/<id>`

3. View logs: `curl http://localhost:3000/logs/<id>`

4. Download artifacts: `curl http://localhost:3000/artifact/<id>/<filename>`

## Security

Set `MCP_API_KEY` environment variable for API key authentication.

Use `X-MCP-KEY` header in requests.

## Git Hook

The pre-push hook runs CI before pushing. Make sure .git/hooks/pre-push is executable.

## Scripts

- `npm run ci:local`: Run CI locally

- `npm run deploy:local`: Deploy dist to C:\deploy\myapp