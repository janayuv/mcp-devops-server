# 🚀 Using CI/CD Orchestrator as MCP Server in Cursor

This guide shows you how to integrate the CI/CD Orchestrator as an MCP (Model Context Protocol) server in Cursor, allowing you to trigger builds, check status, and manage deployments directly from within Cursor.

## 📋 Prerequisites

- Cursor IDE installed
- Node.js installed
- This CI/CD project set up

## 🔧 Setup Instructions

### 1. Install MCP Dependencies
```powershell
npm install @modelcontextprotocol/sdk
```

### 2. Configure Cursor MCP Integration

#### Option A: Using Cursor Settings (Recommended)
1. Open Cursor
2. Go to **Settings** → **Extensions** → **MCP**
3. Add the following configuration:

```json
{
  "mcpServers": {
    "cicd-orchestrator": {
      "command": "node",
      "args": ["mcp-cursor-server.js"],
      "cwd": "D:\\tools\\CICD",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### Option B: Using Configuration File
1. Copy `cursor-mcp-config.json` to your Cursor configuration directory
2. Restart Cursor

### 3. Start the MCP Server
```powershell
npm run start:mcp-cursor
```

## 🎯 Available MCP Tools

Once integrated, you'll have access to these tools in Cursor:

### 1. **trigger_ci**
Triggers a CI/CD build pipeline
```json
{
  "branch": "main",
  "environment": "development"
}
```

### 2. **get_job_status**
Check the status of a running job
```json
{
  "job_id": "your-job-id-here"
}
```

### 3. **get_job_logs**
Get detailed logs for a job
```json
{
  "job_id": "your-job-id-here"
}
```

### 4. **list_jobs**
List recent CI/CD jobs
```json
{
  "limit": 10
}
```

### 5. **deploy_application**
Deploy the application
```json
{
  "environment": "local"
}
```

### 6. **run_tests**
Run tests without full CI pipeline
```json
{
  "test_type": "unit"
}
```

## 🎨 How to Use in Cursor

### Method 1: Direct Tool Invocation
1. Open Cursor's command palette (`Ctrl+Shift+P`)
2. Type "MCP" to see available MCP tools
3. Select the tool you want to use
4. Provide the required parameters

### Method 2: Chat Integration
You can ask Cursor to use the CI/CD tools in natural language:

**Examples:**
- "Trigger a CI build for the main branch"
- "Check the status of job abc123"
- "Show me the logs for the latest build"
- "Deploy the application to production"
- "Run unit tests"

### Method 3: Code Context Integration
The MCP server can be used in code contexts:

```javascript
// Ask Cursor: "Use the CI/CD MCP server to trigger a build"
// Cursor will automatically call trigger_ci with appropriate parameters
```

## 🔍 Example Usage Scenarios

### Scenario 1: Daily Development Workflow
```
You: "I just made changes to the code. Can you trigger a CI build?"

Cursor: I'll trigger a CI build for you using the cicd-orchestrator MCP server.

[Uses trigger_ci tool]
Job triggered successfully!

Job ID: 8b556ae4-fa51-490e-a9d3-01644e771ea5
Status: running
Environment: development
Branch: current

You: "Check the status of that job"

Cursor: [Uses get_job_status tool]
Job Status: success
Job ID: 8b556ae4-fa51-490e-a9d3-01644e771ea5
Started: 2025-09-07T17:45:12.877Z
Finished: 2025-09-07T17:45:14.242Z
Exit Code: 0
```

### Scenario 2: Debugging Failed Builds
```
You: "The last build failed. Can you show me the logs?"

Cursor: [Uses list_jobs tool to find the latest job]
[Uses get_job_logs tool to show detailed logs]

Logs for job abc123:
> mcp-cicd@1.0.0 lint
> echo 'linting'
'linting'

> mcp-cicd@1.0.0 test
> echo 'testing'
'testing'

PROCESS EXIT CODE: 1
```

### Scenario 3: Deployment Management
```
You: "Deploy the application to staging"

Cursor: [Uses deploy_application tool]
Deployment to staging completed successfully!

Output:
Directory: C:\deploy\myapp
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        07-09-2025     22:36             10 index.js
```

## 🛠️ Advanced Configuration

### Environment Variables
You can customize the MCP server behavior:

```json
{
  "mcpServers": {
    "cicd-orchestrator": {
      "command": "node",
      "args": ["mcp-cursor-server.js"],
      "cwd": "D:\\tools\\CICD",
      "env": {
        "NODE_ENV": "production",
        "MCP_API_KEY": "your-secret-key",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Custom Tool Parameters
You can extend the MCP server to include custom tools:

```javascript
// Add to mcp-cursor-server.js
{
  name: 'custom_build',
  description: 'Custom build with specific parameters',
  inputSchema: {
    type: 'object',
    properties: {
      build_type: { type: 'string' },
      target_platform: { type: 'string' }
    }
  }
}
```

## 🔒 Security Considerations

### API Key Authentication
Set up API key authentication for production use:

```powershell
$env:MCP_API_KEY = "your-secret-key"
npm run start:mcp-cursor
```

### Network Security
- The MCP server runs locally and communicates via stdio
- No network ports are exposed
- All communication is internal to Cursor

## 🐛 Troubleshooting

### Common Issues

#### 1. MCP Server Not Starting
```powershell
# Check if dependencies are installed
npm list @modelcontextprotocol/sdk

# Verify the server file exists
Test-Path mcp-cursor-server.js
```

#### 2. Tools Not Available in Cursor
- Restart Cursor after configuration changes
- Check Cursor's MCP settings
- Verify the configuration JSON syntax

#### 3. PowerShell Execution Errors
```powershell
# Check PowerShell execution policy
Get-ExecutionPolicy

# Set if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Debug Mode
Enable debug logging:

```json
{
  "env": {
    "DEBUG": "mcp:*"
  }
}
```

## 📊 Benefits of MCP Integration

### 1. **Seamless Integration**
- No need to switch between tools
- Direct access from Cursor's interface
- Natural language interaction

### 2. **Enhanced Productivity**
- Automated workflows
- Context-aware operations
- Reduced manual steps

### 3. **Better Monitoring**
- Real-time status updates
- Integrated logging
- Centralized job management

### 4. **Extensibility**
- Easy to add new tools
- Customizable parameters
- Plugin architecture

## 🚀 Next Steps

1. **Test the Integration**: Try triggering a build from Cursor
2. **Customize Tools**: Add your own custom tools
3. **Set Up Automation**: Create automated workflows
4. **Monitor Performance**: Track build times and success rates

## 📚 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Guide](https://docs.cursor.com/mcp)
- [Node.js MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

---

**Happy Building! 🎉**

With this MCP integration, you can now manage your entire CI/CD pipeline directly from within Cursor, making your development workflow more efficient and streamlined.
