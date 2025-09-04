import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server is running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});