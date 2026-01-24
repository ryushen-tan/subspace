import React from 'react';
import WorkspaceToolbar from './WorkspaceToolbar';
import UnitToggle from './UnitToggle';

const WorkspaceBottomBar = () => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
      <UnitToggle />
      <WorkspaceToolbar />
    </div>
  );
};

export default WorkspaceBottomBar;
