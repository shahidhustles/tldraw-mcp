import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      // Function to send SSE events
      const encoder = new TextEncoder();

      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const response = await fetch(
          "http://localhost:3002/api/tldraw-events",
          {
            headers: {
              Accept: "text/event-stream",
            },
          }
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
          const events = buffer.split("\n\n");
          buffer = events.pop() || ""; // Keep the last incomplete event in the buffer

          for (const event of events) {
            const lines = event.split("\n");
            let eventType = "message";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7);
              } else if (line.startsWith("data: ")) {
                data = line.slice(6);
              }
            }
            if (data) {
              try {
                const parsedData = JSON.parse(data);
                send(eventType, parsedData);
              } catch {
                send(eventType, { rawData: data });
              }
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
