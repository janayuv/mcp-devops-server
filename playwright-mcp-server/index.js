import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec, spawn } from "child_process";

const server = new McpServer({
  name: "playwright-mcp",
  version: "0.1.0",
});

// Tool: Run all Playwright tests
server.registerTool("run_ui_tests", {
  description: "Runs all Playwright UI/UX tests",
  inputSchema: {},
}, async () => {
  return new Promise((resolve, reject) => {
    exec("npx playwright test --reporter=list", (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Error: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: stdout }] });
      }
    });
  });
});

// Tool: Run accessibility scan
server.registerTool("run_accessibility_test", {
  description: "Run accessibility tests with axe-core",
  inputSchema: {},
}, async () => {
  return new Promise((resolve, reject) => {
    exec("npx playwright test tests/accessibility.spec.ts --reporter=json", (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Error: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: stdout }] });
      }
    });
  });
});

// Tool: Security dependency audit
server.registerTool("security_audit", {
  description: "Run npm audit to check for security vulnerabilities in dependencies",
  inputSchema: {},
}, async () => {
  return new Promise((resolve, reject) => {
    exec("npm audit --audit-level=moderate --json", (err, stdout, stderr) => {
      if (err && err.code !== 1) { // npm audit exits with code 1 when vulnerabilities found
        reject({ content: [{ type: "text", text: `Audit failed: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: stdout || "No security vulnerabilities found" }] });
      }
    });
  });
});

// Tool: GitHub Actions workflow validation
server.registerTool("github_workflow_validate", {
  description: "Validate GitHub Actions workflow files",
  inputSchema: {
    workflow_file: { type: "string", description: "Path to workflow file (optional, defaults to .github/workflows/*.yml)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const workflowPath = args.workflow_file || ".github/workflows/*.yml";
    exec(`npx js-yaml ${workflowPath}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Workflow validation failed: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Workflow validation successful:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Code quality analysis with ESLint
server.registerTool("code_quality_check", {
  description: "Run ESLint to check code quality and style",
  inputSchema: {
    files: { type: "string", description: "Files to check (optional, defaults to src/**/*.js)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const files = args.files || "src/**/*.js";
    exec(`npx eslint ${files} --format=json`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `ESLint found issues:\n${stdout}` }] });
      } else {
        resolve({ content: [{ type: "text", text: "Code quality check passed - no issues found" }] });
      }
    });
  });
});

// Tool: Performance testing with Lighthouse
server.registerTool("performance_test", {
  description: "Run Lighthouse performance audit on a URL",
  inputSchema: {
    url: { type: "string", description: "URL to test" },
    output: { type: "string", description: "Output format (json/html)", enum: ["json", "html"] }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    if (!args.url) {
      reject({ content: [{ type: "text", text: "URL is required for performance testing" }] });
      return;
    }
    const format = args.output || "json";
    exec(`npx lighthouse ${args.url} --output=${format} --output-path=./lighthouse-report.${format}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Performance test failed: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Performance test completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Docker build and test
server.registerTool("docker_build_test", {
  description: "Build and test Docker image",
  inputSchema: {
    dockerfile: { type: "string", description: "Path to Dockerfile (optional, defaults to ./Dockerfile)" },
    image_name: { type: "string", description: "Name for the Docker image" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const dockerfile = args.dockerfile || "./Dockerfile";
    const imageName = args.image_name || "test-image";

    exec(`docker build -f ${dockerfile} -t ${imageName} .`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Docker build failed: ${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Docker build successful:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Rust code analysis and testing
server.registerTool("rust_check", {
  description: "Run Rust code analysis and compilation check",
  inputSchema: {
    manifest_path: { type: "string", description: "Path to Cargo.toml (optional, defaults to ./Cargo.toml)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const manifestPath = args.manifest_path || "./Cargo.toml";
    exec(`cargo check --manifest-path ${manifestPath}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Rust check failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Rust check passed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Rust unit tests
server.registerTool("rust_test", {
  description: "Run Rust unit tests",
  inputSchema: {
    manifest_path: { type: "string", description: "Path to Cargo.toml (optional, defaults to ./Cargo.toml)" },
    test_name: { type: "string", description: "Specific test to run (optional)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const manifestPath = args.manifest_path || "./Cargo.toml";
    const testFilter = args.test_name ? `--test ${args.test_name}` : "";
    exec(`cargo test --manifest-path ${manifestPath} ${testFilter}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Rust tests failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Rust tests passed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Rust code formatting check
server.registerTool("rust_fmt_check", {
  description: "Check Rust code formatting with rustfmt",
  inputSchema: {
    manifest_path: { type: "string", description: "Path to Cargo.toml (optional, defaults to ./Cargo.toml)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const manifestPath = args.manifest_path || "./Cargo.toml";
    exec(`cargo fmt --manifest-path ${manifestPath} --check`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Rust formatting check failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: "Rust code is properly formatted" }] });
      }
    });
  });
});

// Tool: Tauri build
server.registerTool("tauri_build", {
  description: "Build Tauri application for production",
  inputSchema: {
    config_path: { type: "string", description: "Path to tauri.conf.json (optional, defaults to ./src-tauri/tauri.conf.json)" },
    target: { type: "string", description: "Build target (optional, e.g., x86_64-apple-darwin)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const configPath = args.config_path || "./src-tauri/tauri.conf.json";
    const target = args.target ? `--target ${args.target}` : "";
    exec(`npx tauri build --config ${configPath} ${target}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Tauri build failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Tauri build successful:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Tauri development server
server.registerTool("tauri_dev", {
  description: "Start Tauri development server",
  inputSchema: {
    config_path: { type: "string", description: "Path to tauri.conf.json (optional, defaults to ./src-tauri/tauri.conf.json)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const configPath = args.config_path || "./src-tauri/tauri.conf.json";
    exec(`npx tauri dev --config ${configPath}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Tauri dev server failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Tauri dev server started:\n${stdout}` }] });
      }
    });
  });
});

// Tool: TypeScript type checking
server.registerTool("typescript_check", {
  description: "Run TypeScript type checking",
  inputSchema: {
    tsconfig: { type: "string", description: "Path to tsconfig.json (optional, defaults to ./tsconfig.json)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const tsconfig = args.tsconfig || "./tsconfig.json";
    exec(`npx tsc --noEmit --project ${tsconfig}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `TypeScript check failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: "TypeScript type checking passed" }] });
      }
    });
  });
});

// Tool: Vitest unit testing
server.registerTool("vitest_test", {
  description: "Run Vitest unit tests for JavaScript/TypeScript",
  inputSchema: {
    config: { type: "string", description: "Path to vitest config file (optional, defaults to ./vitest.config.js)" },
    test_pattern: { type: "string", description: "Test file pattern (optional, defaults to **/*.{test,spec}.{js,ts})" },
    coverage: { type: "boolean", description: "Generate coverage report (optional, defaults to false)" },
    watch: { type: "boolean", description: "Run in watch mode (optional, defaults to false)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const config = args.config ? `--config ${args.config}` : "";
    const testPattern = args.test_pattern || "**/*.{test,spec}.{js,ts}";
    const coverage = args.coverage ? "--coverage" : "";
    const watch = args.watch ? "--watch" : "";
    
    exec(`npx vitest run ${testPattern} ${config} ${coverage} ${watch}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Vitest tests failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Vitest tests completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Testing Library component testing
server.registerTool("testing_library_test", {
  description: "Run Testing Library component tests",
  inputSchema: {
    test_files: { type: "string", description: "Specific test files to run (optional, defaults to **/*.test.{js,ts,jsx,tsx})" },
    environment: { type: "string", description: "Test environment (jsdom/node)", enum: ["jsdom", "node"], default: "jsdom" },
    setup_file: { type: "string", description: "Path to test setup file (optional)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const testFiles = args.test_files || "**/*.test.{js,ts,jsx,tsx}";
    const environment = args.environment || "jsdom";
    const setupFile = args.setup_file ? `--setupFilesAfterEnv ${args.setup_file}` : "";
    
    exec(`npx vitest run ${testFiles} --environment ${environment} ${setupFile}`, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Testing Library tests failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Testing Library tests completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Comprehensive testing suite
server.registerTool("comprehensive_testing", {
  description: "Run comprehensive testing suite including unit, integration, and e2e tests",
  inputSchema: {
    include_unit: { type: "boolean", description: "Include unit tests (default: true)" },
    include_integration: { type: "boolean", description: "Include integration tests (default: true)" },
    include_e2e: { type: "boolean", description: "Include end-to-end tests (default: true)" },
    include_accessibility: { type: "boolean", description: "Include accessibility tests (default: true)" },
    include_performance: { type: "boolean", description: "Include performance tests (default: false)" },
    parallel: { type: "boolean", description: "Run tests in parallel (default: true)" },
    coverage: { type: "boolean", description: "Generate coverage report (default: true)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    
    const runTest = (command, testType) => {
      return new Promise((resolveTest, rejectTest) => {
        exec(command, (err, stdout, stderr) => {
          if (err) {
            errors.push(`${testType} tests failed: ${stderr}`);
            resolveTest(`${testType} tests failed`);
          } else {
            results.push(`${testType} tests passed`);
            resolveTest(`${testType} tests passed`);
          }
        });
      });
    };
    
    const promises = [];
    
    // Unit tests with Vitest
    if (args.include_unit !== false) {
      promises.push(runTest("npx vitest run **/*.{test,spec}.{js,ts} --coverage", "Unit"));
    }
    
    // Integration tests
    if (args.include_integration !== false) {
      promises.push(runTest("npx vitest run **/*.integration.{test,spec}.{js,ts}", "Integration"));
    }
    
    // E2E tests with Playwright
    if (args.include_e2e !== false) {
      promises.push(runTest("npx playwright test", "E2E"));
    }
    
    // Accessibility tests
    if (args.include_accessibility !== false) {
      promises.push(runTest("npx playwright test tests/accessibility.spec.ts", "Accessibility"));
    }
    
    // Performance tests
    if (args.include_performance === true) {
      promises.push(runTest("npx lighthouse http://localhost:3000 --output=json", "Performance"));
    }
    
    Promise.all(promises).then(() => {
      const summary = results.join('\n');
      const errorSummary = errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : '';
      
      if (errors.length > 0) {
        reject({ content: [{ type: "text", text: `Comprehensive testing completed with some failures:\n${summary}${errorSummary}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Comprehensive testing completed successfully:\n${summary}` }] });
      }
    }).catch((error) => {
      reject({ content: [{ type: "text", text: `Comprehensive testing failed: ${error.message}` }] });
    });
  });
});

// Tool: Storybook dev server (quick local preview)
server.registerTool("storybook_dev", {
  description: "Start Storybook dev server (quick local preview)",
  inputSchema: {
    cwd: { type: "string", description: "Project directory with .storybook (defaults to current)" },
    port: { type: "number", description: "Port for Storybook (default 6006)" },
    config_dir: { type: "string", description: "Path to .storybook directory (optional)" },
    static_dir: { type: "string", description: "Path to static directory (optional)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const cwd = args.cwd || process.cwd();
    const port = args.port || 6006;
    const configDir = args.config_dir ? `--config-dir ${args.config_dir}` : "";
    const staticDir = args.static_dir ? `--static-dir ${args.static_dir}` : "";

    // Spawn non-blocking Storybook dev
    const child = spawn(
      "npx",
      ["storybook", "dev", "-p", String(port), configDir, staticDir].filter(Boolean),
      { cwd, shell: true, detached: true, windowsHide: true }
    );

    child.unref();
    resolve({ content: [{ type: "text", text: `Storybook dev starting on port ${port} (pid ${child.pid}) in ${cwd}` }] });
  });
});

// Tool: Storybook static build (for shareable preview)
server.registerTool("storybook_build", {
  description: "Build Storybook to static files (storybook-static)",
  inputSchema: {
    cwd: { type: "string", description: "Project directory with .storybook (defaults to current)" },
    out_dir: { type: "string", description: "Output dir (default: storybook-static)" },
    config_dir: { type: "string", description: "Path to .storybook directory (optional)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const cwd = args.cwd || process.cwd();
    const outDir = args.out_dir || "storybook-static";
    const configDir = args.config_dir ? `--config-dir ${args.config_dir}` : "";
    exec(`npx storybook build -o ${outDir} ${configDir}`.trim(), { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Storybook build failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Storybook build completed. Output: ${outDir}\n${stdout}` }] });
      }
    });
  });
});

// Tool: Playwright visual testing (snapshots)
server.registerTool("playwright_visual_test", {
  description: "Run Playwright tests with visual snapshot comparison",
  inputSchema: {
    cwd: { type: "string", description: "Working directory (defaults to current)" },
    test_pattern: { type: "string", description: "Test pattern (optional)" },
    update_snapshots: { type: "boolean", description: "Update snapshots (default false)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const cwd = args.cwd || process.cwd();
    const pattern = args.test_pattern ? ` ${args.test_pattern}` : "";
    const update = args.update_snapshots ? " --update-snapshots" : "";
    exec(`npx playwright test${pattern}${update}`.trim(), { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Playwright visual tests failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Playwright visual tests completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Playwright Component Testing
server.registerTool("playwright_component_test", {
  description: "Run Playwright component tests using a component test config",
  inputSchema: {
    cwd: { type: "string", description: "Working directory (defaults to current)" },
    config: { type: "string", description: "Path to Playwright CT config (default: playwright-ct.config.ts)" },
    test_pattern: { type: "string", description: "Optional test pattern" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const cwd = args.cwd || process.cwd();
    const config = args.config || "playwright-ct.config.ts";
    const pattern = args.test_pattern ? ` ${args.test_pattern}` : "";
    exec(`npx playwright test -c ${config}${pattern}`.trim(), { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Playwright component tests failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Playwright component tests completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Chromatic publish (shareable Storybook preview)
server.registerTool("chromatic_publish", {
  description: "Publish Storybook to Chromatic for shareable preview and visual regression",
  inputSchema: {
    cwd: { type: "string", description: "Project directory (defaults to current)" },
    project_token: { type: "string", description: "Chromatic project token (or set CHROMATIC_PROJECT_TOKEN)" },
    storybook_build_dir: { type: "string", description: "Path to prebuilt storybook-static (optional)" },
    branch: { type: "string", description: "Branch name for Chromatic (optional)" },
    exit_zero_on_changes: { type: "boolean", description: "Exit 0 on visual changes (default true)" }
  },
}, async (args) => {
  return new Promise((resolve, reject) => {
    const cwd = args.cwd || process.cwd();
    const token = args.project_token || process.env.CHROMATIC_PROJECT_TOKEN;
    if (!token) {
      reject({ content: [{ type: "text", text: "Chromatic project token is required (pass project_token or set CHROMATIC_PROJECT_TOKEN)" }] });
      return;
    }
    const exitZero = args.exit_zero_on_changes !== false ? "--exit-zero-on-changes" : "";
    const sbDir = args.storybook_build_dir ? `--storybook-build-dir ${args.storybook_build_dir}` : "";
    const branch = args.branch ? `--branch ${args.branch}` : "";
    exec(`npx chromatic --project-token ${token} ${exitZero} ${sbDir} ${branch}`.trim(), { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Chromatic publish failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Chromatic publish completed:\n${stdout}` }] });
      }
    });
  });
});

// Tool: Percy Storybook snapshots (shareable visual checks)
server.registerTool("percy_storybook", {
  description: "Run Percy snapshots against Storybook (builds Storybook if needed)",
  inputSchema: {
    cwd: { type: "string", description: "Project directory (defaults to current)" },
    percy_token: { type: "string", description: "Percy project token (or set PERCY_TOKEN)" },
    build_dir: { type: "string", description: "Existing Storybook static dir (optional)" },
    out_dir: { type: "string", description: "Output dir when building (default: storybook-static)" }
  },
}, async (args) => {
  const cwd = args.cwd || process.cwd();
  const token = args.percy_token || process.env.PERCY_TOKEN;
  if (!token) {
    return { content: [{ type: "text", text: "Percy token is required (pass percy_token or set PERCY_TOKEN)" }], isError: true };
  }
  const runPercy = (buildDir) => new Promise((resolve, reject) => {
    exec(`npx percy storybook --build-dir=${buildDir}`, { cwd, env: { ...process.env, PERCY_TOKEN: token } }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Percy Storybook failed:\n${stderr}` }] });
      } else {
        resolve({ content: [{ type: "text", text: `Percy Storybook completed:\n${stdout}` }] });
      }
    });
  });

  if (args.build_dir) {
    return await runPercy(args.build_dir);
  }

  // Build then run Percy
  const outDir = args.out_dir || "storybook-static";
  return new Promise((resolve, reject) => {
    exec(`npx storybook build -o ${outDir}`, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ content: [{ type: "text", text: `Storybook build failed before Percy:\n${stderr}` }] });
      } else {
        runPercy(outDir).then(resolve).catch(reject);
      }
    });
  });
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server is running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});