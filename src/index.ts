#!/usr/bin/env tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

const LM_STUDIO_BASE_URL = "http://localhost:1234";
const V1 = "/v1";

interface LMStudioModel {
  id: string;
  name?: string;
  object: string;
  created: number;
  owned_by: string;
}

interface LMStudioModelsResponse {
  object: string;
  data: LMStudioModel[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

const server = new McpServer({
  name: "lmstudio-mcp",
  version: "1.0.0",
  description: "A Model Context Protocol server for LM Studio integration"
});

async function makeRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const args = process.argv.slice(2);
  const baseUrlIndex = args.findIndex(arg => arg === '--base-url');
  const baseUrlFromArgs = baseUrlIndex !== -1 && baseUrlIndex + 1 < args.length ? args[baseUrlIndex + 1] : null;

  const response = await fetch(`${baseUrlFromArgs || LM_STUDIO_BASE_URL}${V1}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }).catch((error: unknown) => {
    throw new Error(`LM Studio API request failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  
  if (!response.ok) {
    throw new Error(`LM Studio API request failed: HTTP ${response.status}: ${response.statusText}`);
  }
  
  try {
    return await response.json() as T;
  } catch (error: unknown) {
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

server.registerTool("lmstudio_list_models", {
  title: "List LM Studio Models",
  description: "Get a list of all available models in LM Studio",
  inputSchema: {}
}, async () => {
  try {
    const response = await makeRequest<LMStudioModelsResponse>("/models");
    const models = response.data || [];
    
    if (models.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No models found in LM Studio. Make sure you have loaded models in LM Studio."
        }]
      };
    }
    
    const modelList = models.map((model: LMStudioModel, index: number) => 
      `${index + 1}. ${model.id || model.name || 'Unknown Model'}`
    ).join('\n');
    
    return {
      content: [{
        type: "text",
        text: `Available LM Studio Models (${models.length} total):\n\n${modelList}`
      }]
    };
  } catch (error: unknown) {
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
    const response = await makeRequest<ChatCompletionResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "local-model",
        messages: [{ role: "user", content: "What model are you?" }],
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
  } catch (error: unknown) {
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
  }
}, async ({ prompt, system_prompt }: {
  prompt: string; 
  system_prompt?: string;
}) => {
  try {
    const messages: ChatMessage[] = [];
    
    if (system_prompt) {
      messages.push({ role: "system", content: system_prompt });
    }
    
    messages.push({ role: "user", content: prompt });
    
    const response = await makeRequest<ChatCompletionResponse>("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "local-model",
        messages: messages,
      })
    });
    
    const completion = response.choices?.[0]?.message?.content || "No response generated";
    const model = response.model || "unknown";
    const usage = response.usage || {};
    
    return {
      content: [{
        type: "text",
        text: `**Model:** ${model}\n\n**Response:**\n${completion}\n\n**Usage:** ${JSON.stringify(usage, null, 2)}`
      }]
    };
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    process.stderr.write(`Failed to start server: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Server error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});