import React from "react";

const SidebarShortcutsButton: React.FC = () => {
  return (
    <div>
      <button
        className="w-8 h-8 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-base mx-0.5"
        title="Keyboard Shortcuts"
        onClick={() =>
          alert("Keyboard Shortcuts:\n+ = Zoom In\n- = Zoom Out\n0 = Reset Zoom\n← → = Pan Left/Right")
        }
      >
        ❓
      </button>
    </div>
  );
};

export default SidebarShortcutsButton;
