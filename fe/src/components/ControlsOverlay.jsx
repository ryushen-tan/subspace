import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const shortcuts = [
  { label: 'Orbit', action: 'Left mouse drag' },
  { label: 'Pan', action: 'Middle mouse / Shift + drag' },
  { label: 'Zoom', action: 'Scroll wheel / Pinch' },
  { label: 'Select Point', action: 'Left click on sphere' },
  { label: 'Axis Move', action: 'Gizmo handles (X/Y/Z)' },
  { label: 'Start Auto-Rotate', action: 'Press R' },
];

export default function ControlsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-8 h-8 rounded-lg border border-white/15 bg-white/5 text-white flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors hover:bg-white/10 relative z-10 font-semibold"
        aria-label={isOpen ? 'Close controls helper' : 'Open controls helper'}
      >
        {isOpen ? <X size={16} /> : <span className="text-sm">?</span>}
      </button>

      {isOpen && (
        <div className="fixed top-20 w-[280px] rounded-xl border border-white/10 bg-neutral-900/95 text-white shadow-2xl backdrop-blur-lg p-3 font-['Space_Grotesk',system-ui,sans-serif] z-50" style={{ right: 'calc(1rem + 160px - 140px)' }}>
          <p className="m-0 mb-2 text-[0.85rem] uppercase tracking-[0.05em] text-gray-400">
            Controls
          </p>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {shortcuts.map(({ label, action }) => (
              <li key={label} className="flex justify-between gap-2">
                <span className="font-semibold text-white text-sm">{label}</span>
                <span className="text-xs text-gray-300">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
