"use client";

import { Editor, Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useRef } from "react";

export default function TldrawEditor() {
  const editorRef = useRef<Editor | null>(null);
  const shapesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    console.log(
      "[TldrawEditor] Setting up EventSource connection to /api/events"
    );
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      console.log("[TldrawEditor] EventSource connection opened");
    };

    eventSource.onerror = (error) => {
      console.error("[TldrawEditor] EventSource error:", error);
    };
    eventSource.addEventListener("tldraw-operation", (event) => {
      const operation = JSON.parse(event.data);
      console.log("[TldrawEditor] Received tldraw operation:", operation);

      // Apply the operation to the tldraw editor
      if (editorRef.current) {
        const editor = editorRef.current;

        switch (operation.type) {
          case "createShape": {
            const { shapeType, x, y, width, height, text } = operation.payload; // Create the shape based on the type - tldraw uses "geo" for basic shapes
            const id = editor.createShape({
              type: "geo",
              x,
              y,
              props: {
                w: width,
                h: height,
                geo:
                  shapeType === "rectangle"
                    ? "rectangle"
                    : shapeType === "ellipse"
                    ? "ellipse"
                    : shapeType === "triangle"
                    ? "triangle"
                    : shapeType === "diamond"
                    ? "diamond"
                    : "rectangle",
              },
            }); // If text is provided, update the shape to add text
            if (text && typeof id === "string") {
              editor.updateShape({
                id,
                type: "geo",
                props: {
                  text: text,
                },
              });
            }

            // Store the created shape ID for future reference
            if ("stepNumber" in operation.payload && typeof id === "string") {
              shapesRef.current[`step-${operation.payload.stepNumber}`] = id;
            }

            console.log("Created shape with id:", id);
            break;
          }

          case "connectShapes": {
            const { fromId, toId, arrowType } = operation.payload;

            const actualFromId = shapesRef.current[fromId] || fromId;
            const actualToId = shapesRef.current[toId] || toId;

            const id = editor.createShape({
              type: "arrow",
              props: {
                start: {
                  type: "binding",
                  boundShapeId: actualFromId,
                },
                end: {
                  type: "binding",
                  boundShapeId: actualToId,
                },

                bend: arrowType === "curved" ? 30 : 0,
              },
            });

            console.log("Created arrow with id:", id);
            break;
          }

          case "addText": {
            const { x, y, text, fontSize } = operation.payload;

            const id = editor.createShape({
              type: "text",
              x,
              y,
              props: {
                text,
                fontSize: fontSize || 20,
              },
            });

            console.log("Created text with id:", id);
            break;
          }
          case "createFlowchartStep": {
            const { stepNumber, title, description, x, y, connectToPrevious } =
              operation.payload;

            const id = editor.createShape({
              type: "geo",
              x,
              y,
              props: {
                w: 160,
                h: 80,
                geo: "rectangle",
              },
            }); // Update the shape to add the text content
            if (title && typeof id === "string") {
              editor.updateShape({
                id,
                type: "geo",
                props: {
                  text: title + (description ? `\n${description}` : ""),
                },
              });
            }

            if (typeof id === "string") {
              shapesRef.current[`step-${stepNumber}`] = id;
            }

            if (connectToPrevious && stepNumber > 1) {
              const prevStepId = shapesRef.current[`step-${stepNumber - 1}`];

              if (prevStepId) {
                editor.createShape({
                  type: "arrow",
                  props: {
                    start: {
                      type: "binding",
                      boundShapeId: prevStepId,
                    },
                    end: {
                      type: "binding",
                      boundShapeId: id,
                    },
                  },
                });
              }
            }

            console.log("Created flowchart step with id:", id);
            break;
          }

          case "requestSnapshot": {
            const { requestId } = operation.payload;

            const snapshot = editor.store.getSnapshot();

            fetch("/api/snapshot", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requestId,
                snapshot,
              }),
            }).catch((error) => {
              console.error("Failed to send snapshot:", error);
            });

            console.log("Snapshot requested with id:", requestId);
            break;
          }

          default:
            console.warn("Unknown operation type:", operation.type);
        }
      }
    }); // Add handler for connected event
    eventSource.addEventListener("connected", (event) => {
      console.log("[TldrawEditor] Received connected event:", event.data);
    });

    // Add handler for heartbeat event
    eventSource.addEventListener("heartbeat", (event) => {
      console.log("[TldrawEditor] Received heartbeat event:", event.data);
    });

    // Add handler for debug event
    eventSource.addEventListener("debug", (event) => {
      console.log("[TldrawEditor] Received debug event:", event.data);
    });

    return () => {
      console.log("[TldrawEditor] Closing EventSource connection");
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ height: "calc(100vh - 80px)", width: "100%" }}>
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          console.log("Tldraw editor mounted");
        }}
      />
    </div>
  );
}
