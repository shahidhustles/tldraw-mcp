import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  broadcastOperation,
  eventBus,
  TldrawOperation,
  TldrawSnapshotResponsePayload,
} from "./eventBus.js";

const server = new McpServer({
  name: "TldrawServer",
  version: "1.0.0",
});

server.tool(
  "createShape",
  {
    type: z.enum(["rectangle", "ellipse", "triangle", "diamond"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    text: z.string().optional(),
  },
  async ({ type, x, y, width, height, text }) => {
    broadcastOperation({
      type: "createShape",
      payload: {
        shapeType: type,
        x,
        y,
        width,
        height,
        text: text || "",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Created a ${type} at position (${x}, ${y})`,
        },
      ],
    };
  }
);

server.tool(
  "connectShapes",
  {
    fromId: z.string(),
    toId: z.string(),
    arrowType: z.enum(["straight", "curved", "orthogonal"]).optional(),
  },
  async ({ fromId, toId, arrowType }) => {
    broadcastOperation({
      type: "connectShapes",
      payload: {
        fromId,
        toId,
        arrowType: arrowType || "straight",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Connected shape ${fromId} to ${toId}`,
        },
      ],
    };
  }
);

server.tool(
  "addText",
  {
    x: z.number(),
    y: z.number(),
    text: z.string(),
    fontSize: z.number().optional(),
  },
  async ({ x, y, text, fontSize }) => {
    broadcastOperation({
      type: "addText",
      payload: {
        x,
        y,
        text,
        fontSize: fontSize || 20,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Added text "${text}" at position (${x}, ${y})`,
        },
      ],
    };
  }
);

server.tool(
  "createFlowchartStep",
  {
    stepNumber: z.number(),
    title: z.string(),
    description: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    connectToPrevious: z.boolean().optional(),
  },
  async ({ stepNumber, title, description, x, y, connectToPrevious }) => {
    const posX = x || stepNumber * 200;
    const posY = y || 200;

    broadcastOperation({
      type: "createFlowchartStep",
      payload: {
        stepNumber,
        title,
        description: description || "",
        x: posX,
        y: posY,
        connectToPrevious: connectToPrevious !== false,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Created flowchart step ${stepNumber}: ${title}`,
        },
      ],
    };
  }
);

server.tool("getSnapshot", {}, async () => {
  return new Promise((resolve) => {
    const requestId = `snapshot-${Date.now()}`;

    broadcastOperation({
      type: "requestSnapshot",
      payload: { requestId },
    });
    const snapshotListener = (data: TldrawOperation) => {
      if (
        data.type === "snapshotResponse" &&
        "requestId" in data.payload &&
        data.payload.requestId === requestId
      ) {
        eventBus.off("snapshot-response", snapshotListener);

        resolve({
          content: [
            {
              type: "text",
              text: `Diagram snapshot captured`,
            },
          ],
          snapshot: (data.payload as TldrawSnapshotResponsePayload).snapshot,
        });
      }
    };

    eventBus.on("snapshot-response", snapshotListener);

    setTimeout(() => {
      eventBus.off("snapshot-response", snapshotListener);
      resolve({
        content: [
          {
            type: "text",
            text: `Failed to capture diagram snapshot (timeout)`,
          },
        ],
      });
    }, 5000);
  });
});

const transport = new StdioServerTransport();
await server.connect(transport);
