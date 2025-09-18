import React from "react";

interface SidebarProps {
  onResetZoom?: () => void;
  onToggleCrosshair?: () => void;
  onToggleDotMode?: () => void;
  onClearMarkers?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onResetZoom,
  onToggleCrosshair,
  onToggleDotMode,
  onClearMarkers,
}) => {
  const buttonStyle = {
    width: "32px",
    height: "32px",
    borderTop: "1px solid #ccc",
    borderRight: "1px solid #ccc",
    borderBottom: "1px solid #ccc",
    borderLeft: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    margin: "2px",
  };

  return (
    <div
      style={{
        width: "48px",
        padding: "8px",
        borderRight: "1px solid #ccc",
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Chart Tools */}
      <div style={{ marginBottom: "8px" }}>
        <button
          style={buttonStyle}
          title="Crosshair"
          onClick={onToggleCrosshair}
        >
          ✚
        </button>
      </div>

      {/* Dot Placement Tool */}
      <div style={{ marginBottom: "8px" }}>
        <button
          style={buttonStyle}
          title="Toggle Dot Placement"
          onClick={onToggleDotMode}
        >
          •
        </button>
      </div>

      {/* Essential Chart Controls */}
      <div style={{ marginBottom: "8px" }}>
        <button style={buttonStyle} title="Reset Zoom" onClick={onResetZoom}>
          🔄
        </button>
      </div>

      {/* Marker Controls */}
      <div style={{ marginBottom: "8px" }}>
        <button
          style={buttonStyle}
          title="Clear All Markers"
          onClick={onClearMarkers}
        >
          🗑️
        </button>
      </div>

      {/* Help */}
      <div>
        <button
          style={buttonStyle}
          title="Keyboard Shortcuts: + = Zoom In, - = Zoom Out, 0 = Reset, ← → = Pan"
          onClick={() =>
            alert(
              "Keyboard Shortcuts:\n+ = Zoom In\n- = Zoom Out\n0 = Reset Zoom\n← → = Pan Left/Right"
            )
          }
        >
          ❓
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
