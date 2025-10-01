import React from "react";

interface SidebarProps {
  activeTool?: string;
  onResetZoom?: () => void;
  onToggleCrosshair?: () => void;
  onToggleDotMode?: () => void;
  onToggleLineMode?: () => void;
  onClearSeries?: () => void;
  getRemainingPoints?: () => number;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  onResetZoom,
  onToggleCrosshair,
  onToggleDotMode,
  onToggleLineMode,
  onClearSeries,
  getRemainingPoints,
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
    <>
      <style>{`
        .chart-sidebar {
          width: 48px;
          padding: 8px;
          border-right: 1px solid #ccc;
          background-color: #f5f5f5;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @media (max-width: 768px) {
          .chart-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #ccc;
            flex-direction: row;
            justify-content: center;
            padding: 4px;
          }
        }
      `}</style>
      <div className="chart-sidebar">
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
            style={{
              ...buttonStyle,
              backgroundColor: activeTool === "dot" ? "#4caf50" : "#fff",
              color: activeTool === "dot" ? "#fff" : "#000",
            }}
            title="Toggle Dot Placement"
            onClick={onToggleDotMode}
          >
            •
          </button>
        </div>

        {/* Line Drawing Tool */}
        <div style={{ marginBottom: "8px" }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: activeTool === "line" ? "#4caf50" : "#fff",
              color: activeTool === "line" ? "#fff" : "#000",
            }}
            title="Line Drawing Tool"
            onClick={onToggleLineMode}
          >
            {activeTool === "line" && getRemainingPoints
              ? getRemainingPoints()
              : "📏"}
          </button>
        </div>

        {/* Essential Chart Controls */}
        <div style={{ marginBottom: "8px" }}>
          <button style={buttonStyle} title="Reset Zoom" onClick={onResetZoom}>
            🔄
          </button>
        </div>

        {/* Series Controls */}
        <div style={{ marginBottom: "8px" }}>
          <button
            style={buttonStyle}
            title="Clear All Series"
            onClick={onClearSeries}
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
    </>
  );
};

export default Sidebar;
