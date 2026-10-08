"use client";

import {
  Background,
  type Edge,
  type Node,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertCircle, CheckCircle2, Clock3, Loader2, Play } from "lucide-react";
import { useMemo } from "react";
import type {
  ExecutionDetail,
  PublicationStatus,
} from "@/types/execution.type";

type WorkflowState = "queued" | "running" | "success" | "partial" | "failed";

function stateFromPublication(status: PublicationStatus): WorkflowState {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "failed";
  if (status === "RUNNING") return "running";
  return "queued";
}

function stateFromExecution(execution: ExecutionDetail): WorkflowState {
  if (execution.status === "COMPLETED") return "success";
  if (execution.status === "PARTIALLY_COMPLETED") return "partial";
  if (execution.status === "FAILED") return "failed";
  if (execution.status === "RUNNING") return "running";
  return "queued";
}

function stateMeta(state: WorkflowState) {
  switch (state) {
    case "running":
      return {
        label: "Publishing",
        color: "var(--link)",
        icon: Loader2,
      };
    case "success":
      return {
        label: "Published",
        color: "var(--success)",
        icon: CheckCircle2,
      };
    case "partial":
      return {
        label: "Partial",
        color: "var(--warning)",
        icon: AlertCircle,
      };
    case "failed":
      return {
        label: "Failed",
        color: "var(--destructive)",
        icon: AlertCircle,
      };
    default:
      return {
        label: "Queued",
        color: "var(--muted-foreground)",
        icon: Clock3,
      };
  }
}

function nodeLabel(title: string, state: WorkflowState) {
  const meta = stateMeta(state);
  const Icon = title === "START" ? Play : meta.icon;
  return (
    <div className="flex min-w-28 flex-col items-center gap-2 text-center">
      <span className="text-xs font-medium tracking-wide">{title}</span>
      <span
        className="inline-flex items-center gap-1 text-xs"
        style={{ color: meta.color }}
      >
        <Icon
          className={state === "running" ? "size-3 animate-spin" : "size-3"}
          aria-hidden="true"
        />
        {meta.label}
      </span>
    </div>
  );
}

function nodeStyle(state: WorkflowState): React.CSSProperties {
  const meta = stateMeta(state);
  return {
    background: "var(--card)",
    border: `1px solid ${meta.color}`,
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-card)",
    color: "var(--foreground)",
    padding: "10px 12px",
    width: 150,
  };
}

export function WorkflowGraph({ execution }: { execution: ExecutionDetail }) {
  const { nodes, edges } = useMemo(() => {
    const platformNodes: Node[] = execution.publications.map(
      (publication, index) => {
        const state = stateFromPublication(publication.status);
        return {
          id: publication.id,
          position: { x: 420, y: index * 120 },
          data: {
            label: nodeLabel(publication.platform.name.toUpperCase(), state),
          },
          style: nodeStyle(state),
          draggable: false,
          selectable: false,
        };
      },
    );
    const endState = stateFromExecution(execution);
    const builtNodes: Node[] = [
      {
        id: "start",
        position: { x: 0, y: 60 },
        data: { label: nodeLabel("START", "success") },
        style: nodeStyle("success"),
        draggable: false,
        selectable: false,
      },
      {
        id: "prepare",
        position: { x: 210, y: 60 },
        data: {
          label: nodeLabel(
            "PREPARE CONTENT",
            execution.status === "PENDING" ? "queued" : "success",
          ),
        },
        style: nodeStyle(execution.status === "PENDING" ? "queued" : "success"),
        draggable: false,
        selectable: false,
      },
      ...platformNodes,
      {
        id: "end",
        position: { x: 650, y: 60 },
        data: { label: nodeLabel("END", endState) },
        style: nodeStyle(endState),
        draggable: false,
        selectable: false,
      },
    ];
    const platformEdges: Edge[] = execution.publications.map((publication) => ({
      id: `prepare-${publication.id}`,
      source: "prepare",
      target: publication.id,
      animated: publication.status === "RUNNING",
      style: { stroke: "var(--muted-foreground)" },
    }));
    const builtEdges: Edge[] = [
      {
        id: "start-prepare",
        source: "start",
        target: "prepare",
        animated: execution.status === "PENDING",
        style: { stroke: "var(--muted-foreground)" },
      },
      ...platformEdges,
      ...execution.publications.map((publication) => ({
        id: `${publication.id}-end`,
        source: publication.id,
        target: "end",
        animated: publication.status === "RUNNING",
        style: { stroke: "var(--muted-foreground)" },
      })),
    ];
    // The layout runs left to right, so edges must leave from the right side
    // of a node and enter on the left (the default handles are top/bottom).
    const orientedNodes = builtNodes.map(
      (node): Node => ({
        ...node,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }),
    );
    return { nodes: orientedNodes, edges: builtEdges };
  }, [execution]);

  return (
    <section
      className="rounded-lg border border-border bg-card p-4 shadow-card"
      aria-labelledby="workflow-title"
    >
      <div className="mb-3">
        <p className="eyebrow">Workflow</p>
        <h2
          id="workflow-title"
          className="mt-2 text-display-sm tracking-[-0.04em]"
        >
          Publishing workflow
        </h2>
      </div>
      <div className="h-80 w-full overflow-hidden rounded-md border border-border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          colorMode="dark"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          aria-label="Read-only publishing workflow graph"
        >
          <Background color="var(--border)" gap={24} />
        </ReactFlow>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        This graph is read-only. The platform result list below is the text
        equivalent for every workflow status.
      </p>
    </section>
  );
}
