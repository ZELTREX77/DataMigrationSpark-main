import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import NodeConfigModal from "./NodeConfigModal";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes = [];
const initialEdges = [];

const panelElements = [
  { id: "panel-1", label: "AI Naming Agent" },
  { id: "panel-2", label: "Structured Output Parser" },
  { id: "panel-3", label: "OBS-206 Primary" },
  { id: "panel-4", label: "Mistral Large Secondary" },
  { id: "panel-5", label: "Mistral Cocktail" },
  { id: "panel-6", label: "getNames" }
];

function CustomNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false);
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (ev) => {
    ev.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const baseStyle = {
    background: "#ffffffff",
    color: "#000000ff",
    borderRadius: 8,
    border: selected ? "2px solid #007bff" : "2px solid #6c6f7a",
    padding: 8,
    minWidth: 60,
    minHeight: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "pre-wrap",
    fontWeight: "bold",
    position: "relative"
  };

  const trashStyle = {
    position: "absolute",
    right: -10,
    top: -10,
    background: "#ffffff6b",
    borderRadius: "50%",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    zIndex: 10
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-block" }}
    >
      <Handle type="target" position={Position.Left} id="target" style={{ background: "#6c6f7a" }} />
      <div style={baseStyle}>{data?.label}</div>
      <Handle type="source" position={Position.Right} id="source" style={{ background: "#6c6f7a" }} />
      {hovered && (
        <div title="Delete node" onClick={onDelete} style={trashStyle}>
          🗑️
        </div>
      )}
    </div>
  );
}

export default function DesignerCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef(null);
  const { project } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    try {
      console.log("[TransformationDesigner] Graph updated:", { nodes, edges });
    } catch (err) {
      console.error("[TransformationDesigner] Failed to log graph", err);
    }
  }, [nodes, edges]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = useCallback((event, label) => {
    event.dataTransfer.setData("application/reactflow", "custom");
    event.dataTransfer.setData("label", label);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const label = event.dataTransfer.getData("label");
      const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      const id = `${+new Date()}`;
      const newNode = { id, type: "custom", position, data: { label } };
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Node click handler to open modal
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Modal close handler
  const handleCloseModal = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Modal save handler
  const handleSaveModal = useCallback((updatedNode) => {
    setNodes((nds) => nds.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div style={{
      width: "80vw",
      height: "80vh",
      borderRadius: 8,
      border: "1px solid #23272f",
      position: "relative",
      margin: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
      <h2 style={{
        color: "#030303ff",
        position: "absolute",
        zIndex: 10,
        left: 20,
        top: 10,
        margin: 0
      }}>Transformation Designer</h2>

      <div ref={reactFlowWrapper} style={{ flex: 1, width: "100%", height: "100%" }} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag
          zoomOnScroll
          style={{ width: "100%", height: "100%" }}
          onNodeClick={onNodeClick}
        >
          <Background color="#b8beca5e" gap={16} />
          <Controls />
        </ReactFlow>
        <NodeConfigModal
          open={!!selectedNode}
          node={selectedNode}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      </div>

      <div style={{
        width: "100%",
        background: "#ffffff3f",
        display: "flex",
        padding: "8px",
        justifyContent: "center",
        gap: "6px",
        borderTop: "1px solid #6c6f7a",
        overflowBlock: "auto"
      }}>
        {panelElements.map((el) => (
          <div
            key={el.id}
            draggable
            onDragStart={(event) => onDragStart(event, el.label)}
            style={{
              background: "#b8beca5e",
              color: "#000000ff",
              borderRadius: 8,
              border: "2px solid #6c6f7a",
              padding: "12px 24px",
              fontWeight: "bold",
              fontSize: 14,
              cursor: "grab",
              userSelect: "none"
            }}
          >
            {el.label}
          </div>
        ))}
      </div>
    </div>
  );
}
