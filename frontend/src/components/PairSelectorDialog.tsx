import React, { useState } from "react";

interface PairSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair: (pair: string) => void;
  currentPair: string;
}

const PairSelectorDialog: React.FC<PairSelectorDialogProps> = ({
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
          width: "500px",
          maxHeight: "600px",
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
            Select Trading Pair
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
          <input
            type="text"
            placeholder="Search pairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
              color: "#111827",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            maxHeight: "350px",
            overflowY: "auto",
            marginBottom: "24px",
          }}
        >
          {filteredPairs.length === 0 ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              No pairs found matching "{searchTerm}"
            </div>
          ) : (
            filteredPairs.map((pair) => (
              <div
                key={pair.symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  backgroundColor:
                    pair.symbol === currentPair ? "#f0f9ff" : "transparent",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  transition: "background-color 0.15s ease",
                }}
                onClick={() => handlePairSelect(pair.symbol)}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "16px",
                      color: "#111827",
                      marginBottom: "4px",
                    }}
                  >
                    {pair.symbol}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: "1.4",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#f3f4f6",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        marginRight: "8px",
                      }}
                    >
                      {pair.category}
                    </span>
                    {pair.name}
                  </div>
                </div>
                {pair.symbol === currentPair && (
                  <div
                    style={{
                      color: "#3b82f6",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            ))
          )}
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
        </div>
      </div>
    </div>
  );
};

export default PairSelectorDialog;
