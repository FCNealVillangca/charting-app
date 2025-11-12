import React, { useState, useContext, useMemo } from "react";
import ChartPairSelector from "./chart-pair-selector";
import { ChartContext } from "./chart-context";
import ChartSettingDialog from "./chart-setting-dialog";

interface ChartNavbarProps {
  currentPair?: string;
  onPairChange?: (pair: string) => void;
}

const ChartNavbar: React.FC<ChartNavbarProps> = ({
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

  const handleDrawingSave = (drawingId: number | null, updates: any) => {
    if (updateDrawing) {
      updateDrawing(drawingId, updates);
    }
  };

  return (
    <div className="h-12 bg-white text-gray-900 flex items-center px-4 border-b border-gray-200 relative z-50 shadow-sm">
      {/* Logo/Brand */}
      <div className="text-lg font-bold mr-8">
        📈 TradingView Clone
      </div>

      {/* Pair Selector */}
      <div className="mr-6">
        <button
          onClick={() => setIsPairDialogOpen(true)}
          className="bg-gray-50 border border-gray-300 rounded-md text-gray-900 px-3 py-1.5 cursor-pointer flex items-center gap-2 text-sm font-medium hover:bg-gray-100"
        >
          <span className="font-bold">{currentPair}</span>
          <span>📊</span>
        </button>
      </div>

      {/* Timeframes */}
      <div className="flex gap-1 mr-6">
        {["1m", "5m", "15m", "1H", "4H", "1D"].map((timeframe) => (
          <button
            key={timeframe}
            className="bg-transparent border border-gray-300 rounded text-gray-500 px-2 py-1 cursor-pointer text-xs min-w-8 hover:bg-gray-50"
          >
            {timeframe}
          </button>
        ))}
      </div>

      {/* Right side controls */}
      <div className="ml-auto flex gap-2">
        {selectedDrawing && (
          <>
            <button
              onClick={() => setIsDrawingDialogOpen(true)}
              className="bg-gray-50 border border-gray-300 rounded-md text-gray-900 px-3 py-1.5 cursor-pointer text-sm font-medium flex items-center gap-1.5 hover:bg-gray-100"
            >
              <span>🎨</span>
              <span>Edit Drawing</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs">
              <span className="text-gray-500">{selectedDrawing.name}</span>
              <div
                className="w-5 h-5 border-2 border-white rounded shadow-sm"
                style={{ backgroundColor: selectedDrawing?.style?.color }}
              />
            </div>
          </>
        )}
        <button className="bg-transparent border border-gray-300 rounded-md text-gray-500 px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-50">
          ⚙️ Settings
        </button>
        <button className="bg-transparent border border-gray-300 rounded-md text-gray-500 px-3 py-1.5 cursor-pointer text-sm hover:bg-gray-50">
          👤 Account
        </button>
      </div>

      <ChartPairSelector
        isOpen={isPairDialogOpen}
        onClose={() => setIsPairDialogOpen(false)}
        onSelectPair={handlePairSelect}
        currentPair={currentPair}
      />

      {selectedDrawing && (
        <ChartSettingDialog
          isOpen={isDrawingDialogOpen}
          onClose={() => setIsDrawingDialogOpen(false)}
          drawing={selectedDrawing}
          onSave={handleDrawingSave}
        />
      )}
    </div>
  );
};

export default ChartNavbar;
