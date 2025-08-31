import React from "react";
import { useNavigate } from "react-router-dom";

export default function TransformationsList() {
  const navigate = useNavigate();
  // Dummy list for now
  const transformations = [
    { id: 1, name: "Customer Data Mapping" },
    { id: 2, name: "Sales Aggregation" }
  ];

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Transformations</h2>
      <ul style={{ marginBottom: 32 }}>
        {transformations.map(t => (
          <li key={t.id} style={{ marginBottom: 8, fontSize: 16 }}>{t.name}</li>
        ))}
      </ul>
      <button
        style={{
          padding: "10px 24px",
          fontSize: 16,
          background: "#23272f",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
        onClick={() => navigate("/transformation-designer")}
      >
        Create Transformation
      </button>
    </div>
  );
}
