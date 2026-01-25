import React from 'react';
import { RotateCw, Plus, Ruler, Move, Upload, Download, Eye } from 'lucide-react';

const WorkspaceToolbar = ({ onPreviewClick }) => {
  const tools = [
    { id: 'rotate', icon: RotateCw, label: 'rotate tool' },
    { id: 'add-vector', icon: Plus, label: 'add vector' },
    { id: 'dimension', icon: Ruler, label: 'dimension tool' },
    { id: 'move', icon: Move, label: 'move tool' },
    { id: 'export', icon: Download, label: 'export' },
    { id: 'import', icon: Upload, label: 'import' },
    { id: 'preview', icon: Eye, label: 'preview', onClick: onPreviewClick, highlight: true },
  ];

  return (
    <div className="bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 z-10 flex items-center gap-2 shadow-2xl">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={tool.onClick || undefined}
            className={`p-2 rounded-lg transition-colors group relative ${
              tool.highlight
                ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 hover:text-indigo-300'
                : 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
            }`}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
              {tool.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default WorkspaceToolbar;
