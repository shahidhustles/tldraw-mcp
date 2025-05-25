import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("[API] Events route: Starting SSE connection");

  const startTime = new Date().toISOString();
  console.log(`[API] Events route: Start time ${startTime}`);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        console.log(`[API] Events route: Sending event: ${event}`, data);
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }; 
      send("debug", {
        message: "API route initialized",
        timestamp: new Date().toISOString(),
      });

      try {
        console.log("[API] Events route: Connecting to HTTP server");
        const response = await fetch(
          "http://localhost:3002/api/tldraw-events",
          {
            headers: {
              Accept: "text/event-stream",
            },
          }
        );

        console.log(
          "[API] Events route: HTTP server response status:",
          response.status
        );

        if (!response.ok || !response.body) {
          throw new Error(
            `Failed to connect to SSE endpoint: ${response.status}`
          );
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Function to process SSE events from the buffer
        const processEvents = () => {
          console.log(
            `[API] Events route: Processing buffer of length ${buffer.length}`
          );

          const events = buffer.split("\n\n");
          const remainingBuffer = events.pop() || ""; // Keep the last incomplete event in the buffer

          console.log(
            `[API] Events route: Found ${events.length} events in buffer`
          );

          buffer = remainingBuffer;

          for (const event of events) {
            if (!event.trim()) continue; // Skip empty event strings

            // ADDED: Log the raw event string
            console.log(
              `[API] Events route: Raw event block received: "${event}"`
            );

            const lines = event.split("\n");
            let eventType = "message"; // Default if no 'event:' line
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim(); // Added trim()
              } else if (line.startsWith("data: ")) {
                data = line.slice(6).trim(); // Added trim()
              }
            }

            // ADDED: Log parsed type and data before conditional logic
            console.log(
              `[API] Events route: Parsed eventType: "${eventType}", Raw data string: "${data}"`
            );

            if (data) {
              if (eventType === "heartbeat") {
                console.log(`[API] Events route: Received heartbeat: ${data}`);
                send(eventType, { message: data });
              } else {
                try {
                  const parsedData = JSON.parse(data);
                  console.log(
                    `[API] Events route: Received event from HTTP server (type: ${eventType}):`, // Clarified log
                    parsedData
                  );
                  send(eventType, parsedData);
                } catch (error) {
                  console.error(
                    `[API] Events route: Error parsing event data for type ${eventType}: "${data}"`, // Clarified log
                    error
                  );
                  // It's often better not to send a differently structured message on parse error
                  // unless the client is specifically designed to handle it.
                  // send(eventType, { rawData: data, parseError: (error as Error).message });
                }
              }
            } else {
              // ADDED: Log if data is empty after parsing lines
              console.log(
                `[API] Events route: No data found for eventType: "${eventType}", event block: "${event}"`
              );
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          processEvents();
        }

        buffer += decoder.decode();
        processEvents();
      } catch (error) {
        console.error("Error connecting to SSE endpoint:", error);
        send("error", { message: "Failed to connect to tldraw server" });
        controller.close();
      }

      req.signal.addEventListener("abort", () => {
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
