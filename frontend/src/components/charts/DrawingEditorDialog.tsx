import React, { useState, useEffect } from "react";
import type { Drawing } from "./chart-types";

interface DrawingEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drawing: Drawing | null;
  onSave: (drawingId: string, updates: Partial<Drawing>) => void;
}

const DrawingEditorDialog: React.FC<DrawingEditorDialogProps> = ({
  isOpen,
  onClose,
  drawing,
  onSave,
}) => {
  const [color, setColor] = useState(drawing?.color || "#4caf50");

  // Update color when drawing changes
  useEffect(() => {
    if (drawing) {
      setColor(drawing.color);
    }
  }, [drawing]);

  const handleSave = () => {
    if (drawing) {
      onSave(drawing.id, { color });
      onClose();
    }
  };

  if (!isOpen || !drawing) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          width: "400px",
          color: "#111827",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Edit {drawing.name} ({drawing.type})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Color
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: "60px",
                height: "40px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
                color: "#111827",
                fontSize: "14px",
                fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            paddingTop: "16px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.15s ease",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.15s ease",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingEditorDialog;

