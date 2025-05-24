# Tldraw MCP Server

This is the MCP server component for the tldraw-Claude integration. It handles communication with Claude Desktop through the Model Context Protocol (MCP) and provides an HTTP server for Server-Sent Events (SSE) to communicate with the frontend.

## Getting Started

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Build the TypeScript code:

   ```powershell
   npm run build
   # or use the build.bat script
   ```

3. Start the MCP server (for Claude Desktop):

   ```powershell
   npm start
   # or use the start.bat script (builds and runs)
   ```

4. In a separate terminal, start the HTTP server (for SSE):
   ```powershell
   npm run start:http
   # or use the start-http.bat script
   ```

## Server Components

- The MCP server: Communicates with Claude through stdin/stdout (runs on default port)
- The HTTP server: Provides SSE endpoints for the frontend (runs on port 3002)

## Configuration

To connect Claude Desktop to this MCP server, add the following to your Claude Desktop configuration file (typically located at `%AppData%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tldrawserver": {
      "command": "node",
      "args": ["PATH_TO_COMPILED_JS_FILE"]
    }
  }
}
```

Replace `PATH_TO_COMPILED_JS_FILE` with the absolute path to the compiled JavaScript file, e.g., `D:\\tldraw-mcp\\server\\dist\\index.js`.

## Development

For development with automatic restarts:

```powershell
# For the MCP server
npm run dev

# For the HTTP server
npm run dev:http
```

## Build Scripts

- **build.bat**: Compiles TypeScript code into JavaScript in the `dist` folder
- **start.bat**: Builds the code and then starts the MCP server
- **start-http.bat**: Builds the code and then starts the HTTP server

## Architecture

- **MCP Server (index.ts)**: Handles function calls from Claude via stdin/stdout
- **HTTP Server (httpServer.ts)**: Provides SSE endpoints for frontend communication
- **EventBus**: Manages internal event propagation and provides type-safe communication

## Type Safety

The server implements TypeScript interfaces for all message types to ensure type safety across the application. This includes:

- Specific payload types for each event
- Type guards for runtime type checking
- Strong typing for all MCP function parameters
