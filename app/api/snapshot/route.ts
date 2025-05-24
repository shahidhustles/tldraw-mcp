import { NextRequest, NextResponse } from "next/server";
import http from "http";

export async function POST(req: NextRequest) {
  try {
    // Parse the snapshot data from the request
    const data = await req.json();
    const { requestId, snapshot } = data; // Forward the snapshot to the MCP server
    const mcpRequest = http.request({
      hostname: "localhost",
      port: 3002,
      path: "/api/snapshot",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    mcpRequest.write(JSON.stringify({ requestId, snapshot }));
    mcpRequest.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling snapshot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process snapshot" },
      { status: 500 }
    );
  }
}
