#!/usr/bin/env node

import { spawn } from "child_process";

/**
 * Test MCP protocol communication
 */
async function testMCPProtocol(serverPath, serverName) {
  console.log(`\n=== Testing ${serverName} ===`);

  return new Promise((resolve, reject) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: process.cwd()
    });

    let messageId = 1;
    let responses = [];

    server.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          console.log("Received:", JSON.stringify(response, null, 2));
          responses.push(response);
        } catch (e) {
          console.log("Raw output:", line);
        }
      }
    });

    server.stderr.on("data", (data) => {
      console.log("Server stderr:", data.toString());
    });

    server.on("error", (error) => {
      console.error("Server error:", error.message);
      reject(error);
    });

    // Send initialize message
    setTimeout(() => {
      const initMessage = {
        jsonrpc: "2.0",
        id: messageId++,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "test-client",
            version: "1.0.0"
          }
        }
      };
      console.log("Sending initialize...");
      server.stdin.write(JSON.stringify(initMessage) + "\n");
    }, 500);

    // Send tools/list message
    setTimeout(() => {
      const listMessage = {
        jsonrpc: "2.0",
        id: messageId++,
        method: "tools/list",
        params: {}
      };
      console.log("Sending tools/list...");
      server.stdin.write(JSON.stringify(listMessage) + "\n");
    }, 1000);

    // Stop server after testing
    setTimeout(() => {
      server.kill();
      console.log(`${serverName} test completed`);
      resolve(responses);
    }, 2000);
  });
}

async function runTests() {
  try {
    console.log("Starting MCP server tests...");

    // Test playwright-mcp
    await testMCPProtocol("./index.js", "playwright-mcp-simple");

    // Test playwright-mcp-server
    await testMCPProtocol("../playwright-mcp-server/index.js", "playwright-mcp-server");

    console.log("\n=== All tests completed ===");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

runTests();