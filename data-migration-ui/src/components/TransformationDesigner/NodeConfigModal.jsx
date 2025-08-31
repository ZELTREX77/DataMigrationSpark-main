import React from "react";

export default function NodeConfigModal({ open, node, onClose, onSave }) {
  const [label, setLabel] = React.useState(node?.data?.label || "");
  const [description, setDescription] = React.useState(node?.data?.description || "");

  React.useEffect(() => {
    setLabel(node?.data?.label || "");
    setDescription(node?.data?.description || "");
  }, [node]);

  if (!open || !node) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "450px",
      height: "100vh",
      background: "#fff",
      boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      transition: "right 0.3s",
    }}>
      <h3 style={{ marginBottom: 24 }}>Configure Node</h3>
      <label style={{ marginBottom: 8 }}>Label</label>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        style={{ marginBottom: 16, padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <label style={{ marginBottom: 8 }}>Description</label>
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ marginBottom: 24, padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <button
          style={{ padding: "8px 20px", background: "#23272f", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}
          onClick={() => onSave({ ...node, data: { ...node.data, label, description } })}
        >Save</button>
        <button
          style={{ padding: "8px 20px", background: "#eee", color: "#23272f", border: "none", borderRadius: 4 }}
          onClick={onClose}
        >Close</button>
      </div>
    </div>
  );
}
