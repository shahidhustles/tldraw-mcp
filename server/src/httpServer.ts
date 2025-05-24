import { createServer } from "http";
import { eventBus, TldrawOperation } from "./eventBus.js";

// Create and start the HTTP server
const httpServer = createServer((req, res) => {
  if (req.url === "/api/tldraw-events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeatInterval = setInterval(() => {
      res.write("event: heartbeat\ndata: ping\n\n");
    }, 30000);

    // Function to send SSE events
    const sendEvent = (event: string, data: Record<string, unknown>) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial connection confirmation
    sendEvent("connected", { message: "Connected to TldrawServer" });

    // Listen for tldraw operations and forward them to the client
    const operationListener = (operation: TldrawOperation) => {
      sendEvent("tldraw-operation", operation);
    };

    // Register event listener
    eventBus.on("tldraw-operation", operationListener);

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      eventBus.off("tldraw-operation", operationListener);
      console.log("Client disconnected from SSE");
    });
  }
  // for snapshot endpoint
  else if (req.url === "/api/snapshot" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { requestId, snapshot } = data;

        eventBus.emit("snapshot-response", {
          type: "snapshotResponse",
          payload: { requestId, snapshot },
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error("Error processing snapshot:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "Failed to process snapshot",
          })
        );
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Listen on port 3002
httpServer.listen(3002, () => {
  console.log("HTTP Server running on port 3002");
});
