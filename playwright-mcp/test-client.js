#!/usr/bin/env node

import { spawn } from "child_process";

/**
 * Simple MCP client for testing the server
 */
class MCPClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.server = null;
    this.messageId = 1;
  }

  start() {
    return new Promise((resolve, reject) => {
      console.log("Starting MCP server...");
      this.server = spawn("node", [this.serverPath], {
        stdio: ["pipe", "pipe", "pipe"]
      });

      this.server.on("error", (error) => {
        console.error("Failed to start server:", error.message);
        reject(error);
      });

      // Give server time to start
      setTimeout(() => {
        console.log("MCP server started successfully");
        resolve();
      }, 1000);
    });
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      const jsonMessage = JSON.stringify(message);
      console.log("Sending:", jsonMessage);

      let response = "";
      const timeout = setTimeout(() => {
        reject(new Error("Response timeout"));
      }, 10000);

      const onData = (data) => {
        response += data.toString();
        console.log("Received:", response);

        try {
          const parsed = JSON.parse(response);
          clearTimeout(timeout);
          this.server.stdout.removeListener("data", onData);
          resolve(parsed);
        } catch (e) {
          // Wait for more data
        }
      };

      this.server.stdout.on("data", onData);
      this.server.stdin.write(jsonMessage + "\n");
    });
  }

  async initialize() {
    const message = {
      jsonrpc: "2.0",
      id: this.messageId++,
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

    return await this.sendMessage(message);
  }

  async listTools() {
    const message = {
      jsonrpc: "2.0",
      id: this.messageId++,
      method: "tools/list",
      params: {}
    };

    return await this.sendMessage(message);
  }

  async callTool(toolName, args = {}) {
    const message = {
      jsonrpc: "2.0",
      id: this.messageId++,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    };

    return await this.sendMessage(message);
  }

  stop() {
    if (this.server) {
      this.server.kill();
      console.log("MCP server stopped");
    }
  }
}

// Test the server
async function testServer(serverPath) {
  const client = new MCPClient(serverPath);

  try {
    await client.start();

    console.log("\n=== Testing MCP Server ===");

    // Test initialization
    console.log("\n1. Testing initialization...");
    const initResponse = await client.initialize();
    console.log("Initialization response:", JSON.stringify(initResponse, null, 2));

    // Test tool listing
    console.log("\n2. Testing tool listing...");
    const toolsResponse = await client.listTools();
    console.log("Available tools:", JSON.stringify(toolsResponse, null, 2));

    // Test tool calling (if tools are available)
    if (toolsResponse.result && toolsResponse.result.tools && toolsResponse.result.tools.length > 0) {
      const firstTool = toolsResponse.result.tools[0];
      console.log(`\n3. Testing tool call: ${firstTool.name}...`);

      try {
        const toolResponse = await client.callTool(firstTool.name);
        console.log("Tool response:", JSON.stringify(toolResponse, null, 2));
      } catch (error) {
        console.log("Tool call failed (expected for testing without Playwright setup):", error.message);
      }
    }

    console.log("\n=== Test completed successfully ===");

  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    client.stop();
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const serverPath = process.argv[2] || "./index.js";
  testServer(serverPath);
}

export default MCPClient;