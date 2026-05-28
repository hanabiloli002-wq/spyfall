import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import socket from '../socket';

export default function LocationSelectionModal({ setId, setName, initialSelection = [], onClose, onSave }) {
  const [allLocations, setAllLocations] = useState([]);
  const [selected, setSelected] = useState(new Set(initialSelection));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleData = (data) => {
      const set = data.find(s => s.id === setId);
      if (set) {
        setAllLocations(set.locations);
      }
      setIsLoading(false);
    };

    socket.on('location_sets_data', handleData);
    socket.emit('get_location_sets_data');

    return () => {
      socket.off('location_sets_data', handleData);
    };
  }, [setId]);

  const toggleLocation = (loc) => {
    const next = new Set(selected);
    if (next.has(loc)) next.delete(loc);
    else next.add(loc);
    setSelected(next);
  };

  const selectRandom = (count) => {
    const shuffled = [...allLocations].sort(() => 0.5 - Math.random());
    setSelected(new Set(shuffled.slice(0, count)));
  };

  const handleSave = () => {
    onSave(Array.from(selected));
  };

  return (
    <Modal title={`Edit: ${setName}`} onClose={onClose}>
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading locations...</div>
      ) : (
        <div className="flex flex-col h-[60vh] max-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
              Selected: {selected.size} / {allLocations.length}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set())} className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">Clear</button>
              <button onClick={() => setSelected(new Set(allLocations))} className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">All</button>
              <button onClick={() => selectRandom(20)} className="px-3 py-1 text-xs font-bold rounded bg-violet-500 text-white hover:bg-violet-600 transition-colors">Random 20</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
            {allLocations.map(loc => {
              const isSelected = selected.has(loc);
              return (
                <div 
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                    isSelected 
                      ? 'bg-violet-500/10 border-violet-500/50 text-violet-700 dark:text-violet-300' 
                      : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'bg-violet-500 border-violet-500 text-white' 
                      : 'border-slate-300 dark:border-white/20'
                  }`}>
                    {isSelected && '✓'}
                  </div>
                  <span className="font-medium text-sm">{loc}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-500/20 transition-all">
              Save Selection
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
