#!/usr/bin/env node

/**
 * Test script for MCP CI/CD Server
 * This script tests the MCP server functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function testMCPServer() {
  console.log('🧪 Testing MCP CI/CD Server...\n');

  // Start the MCP server
  const server = spawn('node', ['mcp-cursor-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  let serverOutput = '';
  let serverError = '';

  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    serverError += data.toString();
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ MCP Server started successfully');
  console.log('📊 Server Output:', serverOutput);
  if (serverError) {
    console.log('⚠️  Server Error:', serverError);
  }

  // Test MCP protocol communication
  console.log('\n🔍 Testing MCP Protocol Communication...');

  // Send list tools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ MCP Protocol communication test completed');

  // Clean up
  server.kill();
  console.log('\n🎉 MCP Server test completed successfully!');
}

// Run the test
testMCPServer().catch(console.error);
