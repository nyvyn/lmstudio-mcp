#!/usr/bin/env tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

const LM_STUDIO_BASE_URL = "http://localhost:1234/v1";

const server = new McpServer({
  name: "lmstudio-mcp-server",
  version: "1.0.0",
  description: "A Model Context Protocol server for LM Studio integration"
});

async function makeRequest(endpoint: string, options: any = {}): Promise<any> {
  const response = await fetch(`${LM_STUDIO_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }).catch(error => {
    throw new Error(`LM Studio API request failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  
  if (!response.ok) {
    throw new Error(`LM Studio API request failed: HTTP ${response.status}: ${response.statusText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`LM Studio API response parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

server.registerTool("echo", {
  title: "Echo Tool",
  description: "Echoes back the provided text",
  inputSchema: {
    text: z.string().describe("The text to echo back")
  }
}, async ({ text }: { text: string }) => ({
  content: [{ 
    type: "text", 
    text: `Echo: ${text}` 
  }]
}));

server.registerTool("add", {
  title: "Addition Tool", 
  description: "Add two numbers together",
  inputSchema: {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number")
  }
}, async ({ a, b }: { a: number; b: number }) => ({
  content: [{
    type: "text",
    text: `${a} + ${b} = ${a + b}`
  }]
}));

server.registerTool("get_system_info", {
  title: "System Information",
  description: "Get basic system information",
  inputSchema: {}
}, async () => ({
  content: [{
    type: "text",
    text: JSON.stringify({
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }, null, 2)
  }]
}));

server.registerTool("lmstudio_health_check", {
  title: "LM Studio Health Check",
  description: "Check if LM Studio API is running and accessible",
  inputSchema: {}
}, async () => {
  try {
    const response = await makeRequest("/models");
    return {
      content: [{
        type: "text",
        text: `✅ LM Studio API is running and accessible\nBase URL: ${LM_STUDIO_BASE_URL}\nResponse: ${JSON.stringify(response, null, 2)}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ LM Studio API is not accessible\nBase URL: ${LM_STUDIO_BASE_URL}\nError: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

server.registerTool("lmstudio_list_models", {
  title: "List LM Studio Models",
  description: "Get a list of all available models in LM Studio",
  inputSchema: {}
}, async () => {
  try {
    const response = await makeRequest("/models");
    const models = response.data || [];
    
    if (models.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No models found in LM Studio. Make sure you have loaded models in LM Studio."
        }]
      };
    }
    
    const modelList = models.map((model: any, index: number) => 
      `${index + 1}. ${model.id || model.name || 'Unknown Model'}`
    ).join('\n');
    
    return {
      content: [{
        type: "text",
        text: `Available LM Studio Models (${models.length} total):\n\n${modelList}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to list models\nError: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

server.registerTool("lmstudio_get_current_model", {
  title: "Get Current LM Studio Model",
  description: "Identify the currently loaded model in LM Studio",
  inputSchema: {}
}, async () => {
  try {
    const response = await makeRequest("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "local-model",
        messages: [{ role: "user", content: "What model are you?" }],
        max_tokens: 50,
        temperature: 0.1
      })
    });
    
    const modelInfo = response.model || "unknown";
    const message = response.choices?.[0]?.message?.content || "No response";
    
    return {
      content: [{
        type: "text",
        text: `Current Model: ${modelInfo}\n\nModel Response: ${message}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to get current model\nError: ${error instanceof Error ? error.message : String(error)}\n\nNote: Make sure a model is loaded and running in LM Studio.`
      }]
    };
  }
});

server.registerTool("lmstudio_chat_completion", {
  title: "LM Studio Chat Completion",
  description: "Generate text completion using the current LM Studio model",
  inputSchema: {
    prompt: z.string().describe("The user prompt/message"),
    system_prompt: z.string().optional().describe("Optional system prompt"),
    temperature: z.number().min(0).max(2).default(0.7).describe("Temperature for randomness (0-2)"),
    max_tokens: z.number().min(1).max(4096).default(150).describe("Maximum tokens to generate")
  }
}, async ({ prompt, system_prompt, temperature = 0.7, max_tokens = 150 }: { 
  prompt: string; 
  system_prompt?: string; 
  temperature?: number; 
  max_tokens?: number; 
}) => {
  try {
    const messages: any[] = [];
    
    if (system_prompt) {
      messages.push({ role: "system", content: system_prompt });
    }
    
    messages.push({ role: "user", content: prompt });
    
    const response = await makeRequest("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "local-model",
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens
      })
    });
    
    const completion = response.choices?.[0]?.message?.content || "No response generated";
    const model = response.model || "unknown";
    const usage = response.usage || {};
    
    return {
      content: [{
        type: "text",
        text: `**Model:** ${model}\n**Temperature:** ${temperature}\n**Max Tokens:** ${max_tokens}\n\n**Response:**\n${completion}\n\n**Usage:** ${JSON.stringify(usage, null, 2)}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to generate completion\nError: ${error instanceof Error ? error.message : String(error)}\n\nNote: Make sure a model is loaded and running in LM Studio.`
      }]
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  
  process.stderr.write("LM Studio MCP Server starting...\n");
  
  try {
    await server.connect(transport);
    process.stderr.write("LM Studio MCP Server connected successfully\n");
  } catch (error) {
    process.stderr.write(`Failed to start server: ${error}\n`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`Server error: ${error}\n`);
    process.exit(1);
  });
}