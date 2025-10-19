import React, { useState } from "react";

interface ChartPairSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair: (pair: string) => void;
  currentPair: string;
}

const ChartPairSelector: React.FC<ChartPairSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPair,
  currentPair,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const availablePairs = [
    { symbol: "EURUSD", name: "Euro vs US Dollar", category: "Major" },
    { symbol: "GBPUSD", name: "British Pound vs US Dollar", category: "Major" },
    { symbol: "USDJPY", name: "US Dollar vs Japanese Yen", category: "Major" },
    {
      symbol: "AUDUSD",
      name: "Australian Dollar vs US Dollar",
      category: "Major",
    },
    {
      symbol: "USDCAD",
      name: "US Dollar vs Canadian Dollar",
      category: "Major",
    },
    { symbol: "USDCHF", name: "US Dollar vs Swiss Franc", category: "Major" },
    {
      symbol: "NZDUSD",
      name: "New Zealand Dollar vs US Dollar",
      category: "Major",
    },
    { symbol: "EURGBP", name: "Euro vs British Pound", category: "Cross" },
    { symbol: "EURJPY", name: "Euro vs Japanese Yen", category: "Cross" },
    {
      symbol: "GBPJPY",
      name: "British Pound vs Japanese Yen",
      category: "Cross",
    },
    {
      symbol: "AUDJPY",
      name: "Australian Dollar vs Japanese Yen",
      category: "Cross",
    },
    {
      symbol: "CADJPY",
      name: "Canadian Dollar vs Japanese Yen",
      category: "Cross",
    },
  ];

  const filteredPairs = availablePairs.filter(
    (pair) =>
      pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePairSelect = (pair: string) => {
    onSelectPair(pair);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg max-h-[600px] text-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-xl font-semibold text-gray-900">
            Select Trading Pair
          </h2>
          <button
            onClick={onClose}
            className="bg-none border-none text-gray-500 text-2xl cursor-pointer p-1 rounded-md hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 text-sm outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="max-h-[350px] overflow-y-auto mb-6">
          {filteredPairs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No pairs found matching "{searchTerm}"
            </div>
          ) : (
            filteredPairs.map((pair) => (
              <div
                key={pair.symbol}
                className={`flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer rounded-lg mb-1 transition-colors duration-150 ${
                  pair.symbol === currentPair 
                    ? "bg-blue-50" 
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handlePairSelect(pair.symbol)}
              >
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-900 mb-1">
                    {pair.symbol}
                  </div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-medium mr-2">
                      {pair.category}
                    </span>
                    {pair.name}
                  </div>
                </div>
                {pair.symbol === currentPair && (
                  <div className="text-blue-600 text-lg font-bold">
                    ✓
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer text-sm font-medium transition-all duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartPairSelector;

