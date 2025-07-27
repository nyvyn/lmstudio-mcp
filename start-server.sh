#!/bin/bash

echo "Building LM Studio MCP Server..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful. Starting MCP Server..."
    npm start
else
    echo "Build failed. Please check for errors."
    exit 1
fi