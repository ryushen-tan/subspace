import React, { useState } from 'react';

const UnitToggle = () => {
  const [selectedUnit, setSelectedUnit] = useState('inch');

  const units = [
    { id: 'cm', label: 'cm' },
    { id: 'inch', label: 'inch' },
    { id: 'mm', label: 'MM' },
  ];

  return (
    <div className="bg-neutral-950/95 h-[70px] backdrop-blur-md border border-white/10 rounded-l-xl px-2 py-2 z-10 flex items-center gap-1 shadow-2xl">
      {units.map((unit) => (
        <button
          key={unit.id}
          onClick={() => setSelectedUnit(unit.id)}
          className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
            selectedUnit === unit.id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          {unit.label}
        </button>
      ))}
    </div>
  );
};

export default UnitToggle;
