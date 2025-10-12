import React, { useState, useContext, useMemo } from "react";
import PairSelectorDialog from "./PairSelectorDialog";
import { ChartContext } from "./charts/chart-context";
import DrawingEditorDialog from "./charts/DrawingEditorDialog";

interface NavigationBarProps {
  currentPair?: string;
  onPairChange?: (pair: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  currentPair = "EURUSD",
  onPairChange,
}) => {
  const [isPairDialogOpen, setIsPairDialogOpen] = useState(false);
  const [isDrawingDialogOpen, setIsDrawingDialogOpen] = useState(false);
  
  const chartContext = useContext(ChartContext);
  const { selectedDrawingId, drawings, updateDrawing } = chartContext || {};

  // Derive the selected drawing from selectedDrawingId
  const selectedDrawing = useMemo(() => {
    if (!selectedDrawingId || !drawings) return null;
    return drawings.find((d) => d.id === selectedDrawingId) || null;
  }, [selectedDrawingId, drawings]);

  const handlePairSelect = (pair: string) => {
    onPairChange?.(pair);
    setIsPairDialogOpen(false);
  };

  const handleDrawingSave = (drawingId: string, updates: any) => {
    if (updateDrawing) {
      updateDrawing(drawingId, updates);
    }
  };

  return (
    <div
      style={{
        height: "48px",
        backgroundColor: "#ffffff",
        color: "#111827",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid #e5e7eb",
        position: "relative",
        zIndex: 100,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Logo/Brand */}
      <div
        style={{ fontSize: "18px", fontWeight: "bold", marginRight: "32px" }}
      >
        📈 TradingView Clone
      </div>

      {/* Pair Selector */}
      <div style={{ marginRight: "24px" }}>
        <button
          onClick={() => setIsPairDialogOpen(true)}
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            color: "#111827",
            padding: "6px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <span style={{ fontWeight: "bold" }}>{currentPair}</span>
          <span>📊</span>
        </button>
      </div>

      {/* Timeframes */}
      <div style={{ display: "flex", gap: "4px", marginRight: "24px" }}>
        {["1m", "5m", "15m", "1H", "4H", "1D"].map((timeframe) => (
          <button
            key={timeframe}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              color: "#6b7280",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "12px",
              minWidth: "32px",
            }}
          >
            {timeframe}
          </button>
        ))}
      </div>

      {/* Right side controls */}
      <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
        {selectedDrawing && (
          <>
            <button
              onClick={() => setIsDrawingDialogOpen(true)}
              style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                color: "#111827",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎨</span>
              <span>Edit Drawing</span>
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                backgroundColor: "#f9fafb",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#6b7280" }}>{selectedDrawing.name}</span>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: selectedDrawing.color,
                  border: "2px solid #fff",
                  borderRadius: "4px",
                  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </>
        )}
        <button
          style={{
            backgroundColor: "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            color: "#6b7280",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ⚙️ Settings
        </button>
        <button
          style={{
            backgroundColor: "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            color: "#6b7280",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          👤 Account
        </button>
      </div>

      <PairSelectorDialog
        isOpen={isPairDialogOpen}
        onClose={() => setIsPairDialogOpen(false)}
        onSelectPair={handlePairSelect}
        currentPair={currentPair}
      />

      {selectedDrawing && (
        <DrawingEditorDialog
          isOpen={isDrawingDialogOpen}
          onClose={() => setIsDrawingDialogOpen(false)}
          drawing={selectedDrawing}
          onSave={handleDrawingSave}
        />
      )}
    </div>
  );
};

export default NavigationBar;
