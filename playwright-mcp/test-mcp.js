#!/usr/bin/env node

import { spawn } from 'child_process'

// Test the MCP server
async function testMCPServer() {
  console.log('Testing MCP server...')
  
  const child = spawn('node', ['index.js'], {
    cwd: 'D:/tools/playwright-mcp',
    stdio: ['pipe', 'pipe', 'pipe']
  })
  
  let output = ''
  let errorOutput = ''
  
  child.stdout.on('data', (data) => {
    output += data.toString()
  })
  
  child.stderr.on('data', (data) => {
    errorOutput += data.toString()
  })
  
  child.on('close', (code) => {
    console.log('MCP server test completed with code:', code)
    console.log('Output:', output)
    console.log('Error output:', errorOutput)
  })
  
  child.on('error', (error) => {
    console.error('MCP server test failed:', error.message)
  })
  
  // Kill the process after 5 seconds
  setTimeout(() => {
    child.kill()
  }, 5000)
}

testMCPServer()
