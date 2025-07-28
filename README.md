# LM Studio MCP Server

**This IS a local MCP server** that bridges LM Studio with MCP-compatible clients like Claude Code. When you build and run this project, it creates a running MCP server that exposes LM Studio's local API through standardized MCP tools.

## ⚡ Quick Start with Claude Code

### 1. Add This Server to Claude Code

In your project directory where you want to use LM Studio, add this MCP server directly from GitHub:

```bash
claude mcp add lmstudio-mcp -- npx github:nyvyn/lmstudio-mcp
```

Or if you need to specify a custom base URL:

```bash
claude mcp add lmstudio-mcp -- npx github:nyvyn/lmstudio-mcp --base-url http://localhost:1234
```

You can verify it was added with:

```bash
claude mcp list
```

### 2. Start LM Studio

1. Launch LM Studio
2. Load a model
3. Start the local server (should be accessible at `http://localhost:1234`)

### 3. Use in Claude Code

Once configured, you can interact with your local LM Studio models:

- "Check if LM Studio is running"
- "What models do I have available?"
- "Generate a story about dragons using my local model"
- "Use temperature 0.9 to write a creative poem"

## 🚀 Features

- **Health Check**: Verify LM Studio API connectivity
- **Model Management**: List available models and identify the currently loaded model
- **Chat Completions**: Generate text completions with configurable parameters
- **System Integration**: Access system information and basic utilities
- **Robust Error Handling**: Clear error messages and graceful failure handling

## 📋 Requirements

- **Node.js** 18.0+ 
- **LM Studio** running locally with API enabled (default: `http://localhost:1234`)
- **Claude Code** or other MCP-compatible client

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd lmstudio-mcp
npm install
```

### 2. Build the Server

```bash
npm run build
```

## 🔧 Available Tools

### LM Studio Integration Tools

- **`lmstudio_health_check`** - Check if LM Studio API is running and accessible
- **`lmstudio_list_models`** - Get a list of all available models in LM Studio  
- **`lmstudio_get_current_model`** - Identify the currently loaded model
- **`lmstudio_chat_completion`** - Generate text completions with configurable:
  - Custom prompts and system prompts
  - Temperature control (0-2)
  - Max token limits (1-4096)

### Utility Tools

- **`echo`** - Echo back provided text

## 🏃‍♂️ Development

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Quick Start Script
```bash
./start-server.sh
```

### Linting & Type Checking
```bash
npm run lint
npm run typecheck
```

## 🔍 Testing

### Test with Claude Code
```bash
# List your MCP servers
claude mcp list

# Remove if needed
claude mcp remove lmstudio-mcp
```

### Test the server directly with JSON-RPC:

```bash
# List available tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js

# Initialize connection
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}' | node dist/index.js
```

## 🛠️ Configuration

The server connects to LM Studio at `http://localhost:1234` by default. You can configure a custom base URL using command line arguments:

### Command Line Arguments
```bash
npx tsx src/index.ts --base-url http://localhost:1234
```

Note: The server automatically appends `/v1` to the base URL for API requests.

### Claude Code MCP Configuration
Add to your Claude Code MCP configuration:
```json
{
  "mcpServers": {
    "lmstudio": {
      "command": "npx",
      "args": ["tsx", "./src/index.ts", "--base-url", "http://localhost:1234"]
    }
  }
}
```

### Examples
```bash
# Connect to LM Studio on different port
npx tsx src/index.ts --base-url http://localhost:8080

# Connect to remote LM Studio instance
npx tsx src/index.ts --base-url http://192.168.1.100:1234
```
