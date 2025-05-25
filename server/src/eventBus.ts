import { EventEmitter } from "events";

export interface TldrawShapePayload {
  shapeType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
}

export interface TldrawConnectPayload {
  fromId: string;
  toId: string;
  arrowType?: "straight" | "curved" | "orthogonal";
}

export interface TldrawTextPayload {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
}

export interface TldrawFlowchartStepPayload {
  stepNumber: number;
  title: string;
  description?: string;
  x: number;
  y: number;
  connectToPrevious?: boolean;
}

export interface TldrawSnapshotRequestPayload {
  requestId: string;
}

export interface TldrawSnapshotResponsePayload {
  requestId: string;
  snapshot: Record<string, unknown>;
}

export type TldrawOperationPayload =
  | TldrawShapePayload
  | TldrawConnectPayload
  | TldrawTextPayload
  | TldrawFlowchartStepPayload
  | TldrawSnapshotRequestPayload
  | TldrawSnapshotResponsePayload
  | Record<string, unknown>;

export type TldrawOperation = {
  type: string;
  payload: TldrawOperationPayload;
};

// Create a standard event emitter for tldraw operations
export const eventBus = new EventEmitter();

// Helper function to broadcast tldraw operations
export function broadcastOperation(operation: TldrawOperation): void {
  eventBus.emit("tldraw-operation", operation);
}
