# MCP DevOps Server

A comprehensive **Model Context Protocol (MCP)** server providing powerful DevOps and testing tools for modern full-stack applications. Perfect for React + Vite + TailwindCSS + Rust + Shadcn + Tauri projects.

## 🚀 Features

### **13 Powerful Tools**
- 🔒 **Security Audit** - npm dependency vulnerability scanning
- 🧪 **UI Testing** - Playwright UI/UX test execution
- ♿ **Accessibility Testing** - axe-core accessibility validation
- 🦀 **Rust Development** - Code analysis, testing, and formatting
- 🏗️ **Tauri Integration** - Desktop app building and development
- ⚡ **Performance Testing** - Lighthouse performance audits
- 📝 **Code Quality** - ESLint code analysis and formatting
- 🔄 **CI/CD Validation** - GitHub Actions workflow validation
- 🐳 **Docker Support** - Container building and testing
- 🔍 **TypeScript Checking** - Type validation and error detection

## 🛠️ Tech Stack Compatibility

✅ **React + Vite + TailwindCSS + Shadcn**
✅ **Rust + Tauri**
✅ **TypeScript + ESLint**
✅ **Docker + CI/CD**
✅ **Cursor IDE Integration**

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-devops-server.git
cd mcp-devops-server

# Install dependencies
npm install

# Run tests
npm test

# Start the MCP server
npm start
```

## 🎯 Available Tools

### Core Testing Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `run_ui_tests` | Run Playwright UI tests | None |
| `run_accessibility_test` | Run accessibility tests | None |

### Security & Quality Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `security_audit` | Check dependency vulnerabilities | None |
| `code_quality_check` | Run ESLint analysis | `files` (optional) |
| `typescript_check` | TypeScript validation | `tsconfig` (optional) |

### DevOps & CI/CD Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `github_workflow_validate` | Validate GitHub Actions | `workflow_file` (optional) |
| `docker_build_test` | Build Docker images | `dockerfile`, `image_name` |
| `performance_test` | Lighthouse audit | `url`, `output` |

### Rust Development Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `rust_check` | Code compilation check | `manifest_path` (optional) |
| `rust_test` | Run unit tests | `manifest_path`, `test_name` |
| `rust_fmt_check` | Code formatting validation | `manifest_path` (optional) |

### Tauri Desktop Tools
| Tool | Description | Parameters |
|------|-------------|------------|
| `tauri_build` | Production build | `config_path`, `target` |
| `tauri_dev` | Development server | `config_path` |

## 💻 Usage

### Cursor IDE Integration

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "devops-server": {
      "command": "node",
      "args": ["/path/to/mcp-devops-server/playwright-mcp-server/index.js"],
      "env": {
        "PROJECT_DIR": "/path/to/your/project"
      }
    }
  }
}
```

### MCP Protocol Usage

```javascript
// Example: Run security audit
{
  "method": "tools/call",
  "params": {
    "name": "security_audit",
    "arguments": {}
  }
}

// Example: Performance test
{
  "method": "tools/call",
  "params": {
    "name": "performance_test",
    "arguments": {
      "url": "https://example.com",
      "output": "json"
    }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Check code style
npm run lint:check
```

## 📁 Project Structure

```
mcp-devops-server/
├── playwright-mcp/           # Simple MCP server implementation
│   ├── index.js              # Main server file
│   ├── test-client.js        # MCP client for testing
│   ├── test-mcp-protocol.js  # Protocol validation tests
│   ├── eslint.config.js      # ESLint configuration
│   └── package.json          # Dependencies and scripts
├── playwright-mcp-server/    # Advanced MCP server with 13 tools
│   ├── index.js              # Enhanced server with all tools
│   ├── eslint.config.js      # ESLint configuration
│   └── package.json          # Dependencies and scripts
├── github-mcp-server/        # Compiled GitHub MCP server
├── README.md                 # This documentation
└── .gitignore               # Git ignore rules
```

## 🔧 Configuration

### Environment Variables

```bash
# Set project directory for tools
export PROJECT_DIR=/path/to/your/project

# Custom tool configurations can be added here
```

### Tool-Specific Configuration

- **ESLint**: Configure rules in `eslint.config.js`
- **TypeScript**: Configure in `tsconfig.json`
- **Docker**: Customize build parameters
- **Rust**: Set manifest path for multi-crate projects
- **Tauri**: Configure build targets and settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes
7. Push to the branch
8. Create a Pull Request

## 📝 Development Scripts

```bash
# Start development server
npm start

# Run tests
npm test

# Lint and fix code
npm run lint

# Check linting without fixing
npm run lint:check

# Install dependencies
npm install
```

## 🔄 CI/CD Integration

The MCP server includes tools for CI/CD validation:

- **GitHub Actions**: Workflow file validation
- **Docker**: Automated container building
- **Security**: Dependency vulnerability scanning
- **Code Quality**: Automated linting and formatting

## 🌟 Use Cases

### Frontend Development
- Automated UI testing with Playwright
- Accessibility compliance checking
- Performance monitoring with Lighthouse
- Code quality enforcement

### Backend Development
- Rust code analysis and testing
- Security vulnerability scanning
- TypeScript type checking

### Desktop App Development
- Tauri application building
- Cross-platform testing
- Development server management

### DevOps & Deployment
- Docker container building
- CI/CD pipeline validation
- Security auditing
- Performance testing

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [Playwright](https://playwright.dev/) for UI testing
- [ESLint](https://eslint.org/) for code quality
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) for performance
- [Tauri](https://tauri.app/) for desktop apps
- [Rust](https://www.rust-lang.org/) programming language

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mcp-devops-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mcp-devops-server/discussions)
- **Documentation**: [MCP Protocol Docs](https://modelcontextprotocol.io/)

---

**Made with ❤️ for modern full-stack development workflows**