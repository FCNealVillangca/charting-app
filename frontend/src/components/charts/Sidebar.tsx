import React from "react";
import SidebarCrosshairButton from "./sidebar-crosshair-button";
import SidebarScatterButton from "./sidebar-scatter-button";
import SidebarLineButton from "./sidebar-line-button";
import SidebarResetButton from "./sidebar-reset-button";
import SidebarClearButton from "./sidebar-clear-button";
import SidebarShortcutsButton from "./sidebar-shortcuts-button";

const Sidebar: React.FC = () => {
  return (
    <div className="bg-gray-100 border-r border-gray-300 flex flex-col items-start py-2 gap-2 pl-4">
      <SidebarCrosshairButton />
      <SidebarScatterButton />
      <SidebarLineButton />
      <SidebarResetButton />
      <SidebarClearButton />
      <SidebarShortcutsButton />
    </div>
  );
};

export default Sidebar;