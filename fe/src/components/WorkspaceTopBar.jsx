import React from 'react';
import WorkspaceToolbar from './WorkspaceToolbar';
import UnitToggle from './UnitToggle';

const WorkspaceTopBar = ({ onPreviewClick, onRotateClick }) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center z-10">
      <UnitToggle />
      <WorkspaceToolbar onPreviewClick={onPreviewClick} onRotateClick={onRotateClick} />
    </div>
  );
};

export default WorkspaceTopBar;
