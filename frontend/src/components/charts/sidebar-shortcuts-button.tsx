import React from "react";

const SidebarShortcutsButton: React.FC = () => {
  return (
    <button
      className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer flex items-center justify-center text-base font-bold text-gray-800 hover:shadow-md hover:border-gray-400 transition-all duration-200"
      title="Keyboard Shortcuts"
      onClick={() =>
        alert("Keyboard Shortcuts:\n+ = Zoom In\n- = Zoom Out\n0 = Reset Zoom\n← → = Pan Left/Right")
      }
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6"/>
        <path d="M8 4v4"/>
        <path d="M8 12h.01"/>
      </svg>
    </button>
  );
};

export default SidebarShortcutsButton;
