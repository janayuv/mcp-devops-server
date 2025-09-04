#!/usr/bin/env node

import { spawn } from "child_process";
import { readFileSync } from "fs";

/**
 * Simple MCP server for running Playwright tests
 * Provides tools for UI and accessibility testing
 */
class SimpleMCPServer {
  constructor() {
    this.tools = [
      {
        name: "run_ui_tests",
        description: "Run all Playwright UI tests with list reporter",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "run_accessibility_tests",
        description: "Run only accessibility tests with JSON reporter",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ];
  }

  /**
   * Validates that the project directory exists and is accessible
   * @param {string} projectDir - Path to the project directory
   * @throws {Error} If directory doesn't exist or is not accessible
   */
  validateProjectDir(projectDir) {
    const fs = require("fs");
    if (!fs.existsSync(projectDir)) {
      throw new Error(`Project directory does not exist: ${projectDir}`);
    }
    if (!fs.statSync(projectDir).isDirectory()) {
      throw new Error(`Path is not a directory: ${projectDir}`);
    }
  }

  /**
   * Runs Playwright tests in the specified project directory
   * @param {string} projectDir - Path to the project directory
   * @param {object} options - Test options (reporter, testMatch, etc.)
   * @returns {Promise<{output: string}>} Test execution results
   */
  async runPlaywrightTests(projectDir, options = {}) {
    // Validate project directory
    this.validateProjectDir(projectDir);

    return new Promise((resolve, reject) => {
      const args = ["test"];
      
      // Add reporter option
      if (options.reporter) {
        args.push("--reporter", options.reporter);
      }
      
      // Add test pattern (use file path instead of test-dir)
      if (options.testMatch) {
        args.push(options.testMatch);
      }
      
      console.error(`Running: npx playwright ${args.join(" ")} in ${projectDir}`);
      
      const child = spawn("npx", ["playwright", ...args], {
        cwd: projectDir,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true
      });
      
      let output = "";
      let errorOutput = "";
      
      child.stdout.on("data", (data) => {
        output += data.toString();
      });
      
      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ output: output || "Tests completed successfully" });
        } else {
          reject(new Error(`Playwright tests failed with code ${code}:\n${errorOutput || output}`));
        }
      });
      
      child.on("error", (error) => {
        reject(new Error(`Failed to run Playwright tests: ${error.message}`));
      });
    });
  }

  // Handle tool calls
  async handleToolCall(name, args) {
    if (name === "run_ui_tests") {
      try {
        console.error("Running UI tests...");
        
        const projectDir = process.env.PROJECT_DIR || process.cwd();
                 const result = await this.runPlaywrightTests(projectDir, {
           reporter: "list",
           testMatch: "tests/ui.spec.ts"
         });
        
        return {
          content: [
            {
              type: "text",
              text: `UI Tests completed!\n\n${result.output}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error running UI tests: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }

    if (name === "run_accessibility_tests") {
      try {
        console.error("Running accessibility tests...");
        
        const projectDir = process.env.PROJECT_DIR || process.cwd();
                 const result = await this.runPlaywrightTests(projectDir, {
           reporter: "json",
           testMatch: "tests/accessibility.spec.ts"
         });
        
        return {
          content: [
            {
              type: "text",
              text: `Accessibility Tests completed!\n\n${result.output}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error running accessibility tests: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  // Process MCP messages
  async processMessage(message) {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.method === "initialize") {
        return {
          jsonrpc: "2.0",
          id: parsed.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "playwright-mcp-server",
              version: "1.0.0"
            }
          }
        };
      }
      
      if (parsed.method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id: parsed.id,
          result: {
            tools: this.tools
          }
        };
      }
      
      if (parsed.method === "tools/call") {
        const result = await this.handleToolCall(parsed.params.name, parsed.params.arguments);
        return {
          jsonrpc: "2.0",
          id: parsed.id,
          result
        };
      }
      
      return {
        jsonrpc: "2.0",
        id: parsed.id,
        error: {
          code: -32601,
          message: "Method not found"
        }
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: parsed?.id,
        error: {
          code: -32700,
          message: "Parse error"
        }
      };
    }
  }

  // Start the server
  async start() {
    console.error("Playwright MCP server started");
    
    process.stdin.setEncoding("utf8");
    process.stdout.setEncoding("utf8");
    
    process.stdin.on("data", async (data) => {
      const lines = data.toString().split("\n");
      
      for (const line of lines) {
        if (line.trim()) {
          const response = await this.processMessage(line);
          if (response) {
            process.stdout.write(JSON.stringify(response) + "\n");
          }
        }
      }
    });
  }
}

// Start the server
const server = new SimpleMCPServer();
server.start();
