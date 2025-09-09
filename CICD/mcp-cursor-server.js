#!/usr/bin/env node

/**
 * MCP Server for CI/CD Orchestrator
 * Compatible with Cursor's MCP integration
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class CICDMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'cicd-orchestrator',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.jobs = new Map();
    this.mcpDataDir = './mcp_data';
    
    // Ensure mcp_data exists
    if (!fs.existsSync(this.mcpDataDir)) {
      fs.mkdirSync(this.mcpDataDir, { recursive: true });
    }

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'trigger_ci',
            description: 'Trigger a CI/CD build pipeline',
            inputSchema: {
              type: 'object',
              properties: {
                branch: {
                  type: 'string',
                  description: 'Git branch to build (optional)',
                  default: 'current'
                },
                environment: {
                  type: 'string',
                  description: 'Build environment (development, staging, production)',
                  default: 'development'
                }
              }
            }
          },
          {
            name: 'get_job_status',
            description: 'Get the status of a CI/CD job',
            inputSchema: {
              type: 'object',
              properties: {
                job_id: {
                  type: 'string',
                  description: 'The job ID to check status for'
                }
              },
              required: ['job_id']
            }
          },
          {
            name: 'get_job_logs',
            description: 'Get the logs for a CI/CD job',
            inputSchema: {
              type: 'object',
              properties: {
                job_id: {
                  type: 'string',
                  description: 'The job ID to get logs for'
                }
              },
              required: ['job_id']
            }
          },
          {
            name: 'list_jobs',
            description: 'List all recent CI/CD jobs',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of jobs to return',
                  default: 10
                }
              }
            }
          },
          {
            name: 'deploy_application',
            description: 'Deploy the application to the target environment',
            inputSchema: {
              type: 'object',
              properties: {
                environment: {
                  type: 'string',
                  description: 'Target environment for deployment',
                  default: 'local'
                }
              }
            }
          },
          {
            name: 'run_tests',
            description: 'Run tests without full CI pipeline',
            inputSchema: {
              type: 'object',
              properties: {
                test_type: {
                  type: 'string',
                  description: 'Type of tests to run (unit, integration, all)',
                  default: 'all'
                }
              }
            }
          },
          {
            name: 'vitest_test',
            description: 'Run Vitest unit tests for JavaScript/TypeScript',
            inputSchema: {
              type: 'object',
              properties: {
                config: {
                  type: 'string',
                  description: 'Path to vitest config file (optional, defaults to ./vitest.config.js)'
                },
                test_pattern: {
                  type: 'string',
                  description: 'Test file pattern (optional, defaults to **/*.{test,spec}.{js,ts})'
                },
                coverage: {
                  type: 'boolean',
                  description: 'Generate coverage report (optional, defaults to false)'
                },
                watch: {
                  type: 'boolean',
                  description: 'Run in watch mode (optional, defaults to false)'
                }
              }
            }
          },
          {
            name: 'testing_library_test',
            description: 'Run Testing Library component tests',
            inputSchema: {
              type: 'object',
              properties: {
                test_files: {
                  type: 'string',
                  description: 'Specific test files to run (optional, defaults to **/*.test.{js,ts,jsx,tsx})'
                },
                environment: {
                  type: 'string',
                  description: 'Test environment (jsdom/node)',
                  enum: ['jsdom', 'node'],
                  default: 'jsdom'
                },
                setup_file: {
                  type: 'string',
                  description: 'Path to test setup file (optional)'
                }
              }
            }
          },
          {
            name: 'comprehensive_testing',
            description: 'Run comprehensive testing suite including unit, integration, and e2e tests',
            inputSchema: {
              type: 'object',
              properties: {
                include_unit: {
                  type: 'boolean',
                  description: 'Include unit tests (default: true)'
                },
                include_integration: {
                  type: 'boolean',
                  description: 'Include integration tests (default: true)'
                },
                include_e2e: {
                  type: 'boolean',
                  description: 'Include end-to-end tests (default: true)'
                },
                include_accessibility: {
                  type: 'boolean',
                  description: 'Include accessibility tests (default: true)'
                },
                include_performance: {
                  type: 'boolean',
                  description: 'Include performance tests (default: false)'
                },
                parallel: {
                  type: 'boolean',
                  description: 'Run tests in parallel (default: true)'
                },
                coverage: {
                  type: 'boolean',
                  description: 'Generate coverage report (default: true)'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
        case 'trigger_ci':
          return await this.triggerCI(args);
        case 'get_job_status':
          return await this.getJobStatus(args.job_id);
        case 'get_job_logs':
          return await this.getJobLogs(args.job_id);
        case 'list_jobs':
          return await this.listJobs(args.limit || 10);
        case 'deploy_application':
          return await this.deployApplication(args.environment || 'local');
        case 'run_tests':
          return await this.runTests(args.test_type || 'all');
        case 'vitest_test':
          return await this.runVitestTests(args);
        case 'testing_library_test':
          return await this.runTestingLibraryTests(args);
        case 'comprehensive_testing':
          return await this.runComprehensiveTests(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async triggerCI(args = {}) {
    const jobId = uuidv4();
    const jobDir = path.join(this.mcpDataDir, jobId);
    fs.mkdirSync(jobDir, { recursive: true });
    
    const logPath = path.join(jobDir, 'run.log');
    const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });

    this.jobs.set(jobId, {
      id: jobId,
      status: 'queued',
      startedAt: new Date().toISOString(),
      branch: args.branch || 'current',
      environment: args.environment || 'development',
      pid: null
    });

    // Spawn CI process
    const scriptFullPath = path.resolve('./ci.ps1');
    let child = null;
    let spawned = false;

    try {
      // Try pwsh first, then fallback to powershell.exe
      try {
        child = spawn('pwsh', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFullPath], {
          cwd: process.cwd(),
          windowsHide: true
        });
        spawned = true;
      } catch (err) {
        child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFullPath], {
          cwd: process.cwd(),
          windowsHide: true
        });
        spawned = true;
      }

      if (spawned && child.pid) {
        this.jobs.get(jobId).status = 'running';
        this.jobs.get(jobId).pid = child.pid;

        // Pipe outputs
        if (child.stdout) child.stdout.pipe(logStream, { end: false });
        if (child.stderr) child.stderr.pipe(logStream, { end: false });

        child.on('exit', (code) => {
          const job = this.jobs.get(jobId);
          job.status = code === 0 ? 'success' : 'failed';
          job.finishedAt = new Date().toISOString();
          job.exitCode = code;
          logStream.write(`\nPROCESS EXIT CODE: ${code}\n`);
          logStream.end();

          // Copy artifacts
          const artifactsSrc = path.resolve('./artifacts');
          const artifactsDest = path.join(jobDir, 'artifacts');
          if (fs.existsSync(artifactsSrc)) {
            fs.mkdirSync(artifactsDest, { recursive: true });
            this.copyDir(artifactsSrc, artifactsDest);
          }
        });
      }
    } catch (error) {
      this.jobs.get(jobId).status = 'failed';
      this.jobs.get(jobId).finishedAt = new Date().toISOString();
      this.jobs.get(jobId).exitCode = -1;
      logStream.write(`Failed to spawn PowerShell: ${error.message}\n`);
      logStream.end();
    }

    return {
      content: [
        {
          type: 'text',
          text: `CI job triggered successfully!\n\nJob ID: ${jobId}\nStatus: ${this.jobs.get(jobId).status}\nEnvironment: ${args.environment || 'development'}\nBranch: ${args.branch || 'current'}\n\nUse get_job_status with this job ID to monitor progress.`
        }
      ]
    };
  }

  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        content: [
          {
            type: 'text',
            text: `Job ${jobId} not found.`
          }
        ],
        isError: true
      };
    }

    const statusText = `Job Status: ${job.status}
Job ID: ${job.id}
Started: ${job.startedAt}
Finished: ${job.finishedAt || 'Still running'}
Exit Code: ${job.exitCode || 'N/A'}
Process ID: ${job.pid || 'N/A'}
Branch: ${job.branch}
Environment: ${job.environment}`;

    return {
      content: [
        {
          type: 'text',
          text: statusText
        }
      ]
    };
  }

  async getJobLogs(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        content: [
          {
            type: 'text',
            text: `Job ${jobId} not found.`
          }
        ],
        isError: true
      };
    }

    const logPath = path.join(this.mcpDataDir, jobId, 'run.log');
    if (!fs.existsSync(logPath)) {
      return {
        content: [
          {
            type: 'text',
            text: `Log file not found for job ${jobId}.`
          }
        ],
        isError: true
      };
    }

    const logs = fs.readFileSync(logPath, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: `Logs for job ${jobId}:\n\n${logs}`
        }
      ]
    };
  }

  async listJobs(limit = 10) {
    const jobList = Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);

    if (jobList.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No jobs found.'
          }
        ]
      };
    }

    const jobText = jobList.map(job => 
      `${job.id}: ${job.status} (${job.environment}/${job.branch}) - ${job.startedAt}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Recent jobs (${jobList.length}):\n\n${jobText}`
        }
      ]
    };
  }

  async deployApplication(environment = 'local') {
    try {
      const deployScript = path.resolve('./deploy.ps1');
      const result = await this.runPowerShellScript(deployScript);
      
      return {
        content: [
          {
            type: 'text',
            text: `Deployment to ${environment} completed successfully!\n\nOutput:\n${result}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Deployment failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async runTests(testType = 'all') {
    try {
      // Run npm test command
      const result = await this.runNpmCommand('test');
      
      return {
        content: [
          {
            type: 'text',
            text: `Tests (${testType}) completed!\n\nOutput:\n${result}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Tests failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async runVitestTests(args = {}) {
    try {
      const config = args.config ? `--config ${args.config}` : '';
      const testPattern = args.test_pattern || '**/*.{test,spec}.{js,ts}';
      const coverage = args.coverage ? '--coverage' : '';
      const watch = args.watch ? '--watch' : '';
      
      const command = `npx vitest run ${testPattern} ${config} ${coverage} ${watch}`;
      const result = await this.runCommand(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Vitest tests completed!\n\nOutput:\n${result}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Vitest tests failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async runTestingLibraryTests(args = {}) {
    try {
      const testFiles = args.test_files || '**/*.test.{js,ts,jsx,tsx}';
      const environment = args.environment || 'jsdom';
      const setupFile = args.setup_file ? `--setupFilesAfterEnv ${args.setup_file}` : '';
      
      const command = `npx vitest run ${testFiles} --environment ${environment} ${setupFile}`;
      const result = await this.runCommand(command);
      
      return {
        content: [
          {
            type: 'text',
            text: `Testing Library tests completed!\n\nOutput:\n${result}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Testing Library tests failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async runComprehensiveTests(args = {}) {
    try {
      const results = [];
      const errors = [];
      
      const runTest = async (command, testType) => {
        try {
          await this.runCommand(command);
          results.push(`${testType} tests passed`);
          return `${testType} tests passed`;
        } catch (error) {
          errors.push(`${testType} tests failed: ${error.message}`);
          return `${testType} tests failed`;
        }
      };
      
      const promises = [];
      
      // Unit tests with Vitest
      if (args.include_unit !== false) {
        promises.push(runTest('npx vitest run **/*.{test,spec}.{js,ts} --coverage', 'Unit'));
      }
      
      // Integration tests
      if (args.include_integration !== false) {
        promises.push(runTest('npx vitest run **/*.integration.{test,spec}.{js,ts}', 'Integration'));
      }
      
      // E2E tests with Playwright
      if (args.include_e2e !== false) {
        promises.push(runTest('npx playwright test', 'E2E'));
      }
      
      // Accessibility tests
      if (args.include_accessibility !== false) {
        promises.push(runTest('npx playwright test tests/accessibility.spec.ts', 'Accessibility'));
      }
      
      // Performance tests
      if (args.include_performance === true) {
        promises.push(runTest('npx lighthouse http://localhost:3000 --output=json', 'Performance'));
      }
      
      await Promise.all(promises);
      
      const summary = results.join('\n');
      const errorSummary = errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : '';
      
      if (errors.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Comprehensive testing completed with some failures:\n${summary}${errorSummary}`
            }
          ],
          isError: true
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Comprehensive testing completed successfully:\n${summary}`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Comprehensive testing failed: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      let child;
      let output = '';
      
      try {
        child = spawn('cmd', ['/c', command], {
          cwd: process.cwd(),
          windowsHide: true
        });
      } catch (err) {
        reject(new Error(`Failed to spawn command: ${err.message}`));
        return;
      }

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('exit', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command exited with code ${code}: ${output}`));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Process error: ${err.message}`));
      });
    });
  }

  async runPowerShellScript(scriptPath) {
    return new Promise((resolve, reject) => {
      let child;
      let output = '';
      
      try {
        child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
          cwd: process.cwd(),
          windowsHide: true
        });
      } catch (error) {
        reject(new Error(`Failed to spawn PowerShell: ${error.message}`));
        return;
      }

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('exit', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Script exited with code ${code}: ${output}`));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Process error: ${err.message}`));
      });
    });
  }

  async runNpmCommand(command) {
    return new Promise((resolve, reject) => {
      let child;
      let output = '';
      
      try {
        child = spawn('npm', ['run', command], {
          cwd: process.cwd(),
          windowsHide: true
        });
      } catch (err) {
        reject(new Error(`Failed to spawn npm: ${err.message}`));
        return;
      }

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
      }

      child.on('exit', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`npm run ${command} exited with code ${code}: ${output}`));
        }
      });

      child.on('error', (err) => {
        reject(new Error(`Process error: ${err.message}`));
      });
    });
  }

  copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CI/CD MCP Server running on stdio');
  }
}

// Start the server
const server = new CICDMCPServer();
server.run().catch(console.error);
