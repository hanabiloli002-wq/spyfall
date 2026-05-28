import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function LocationList() {
  const { state } = useGame();
  const { t }     = useLanguage();
  const { allLocations, currentLocation, isSpy } = state;
  const [search, setSearch] = useState('');
  const [crossedOut, setCrossedOut] = useState(new Set());

  const toggleCrossOut = (locName) => {
    setCrossedOut(prev => {
      const next = new Set(prev);
      if (next.has(locName)) next.delete(locName);
      else next.add(locName);
      return next;
    });
  };

  const filtered = allLocations.filter(loc =>
    loc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-slate-800 dark:text-white font-semibold text-sm">
            {t('possibleLocations')}
          </h2>
          <p className="text-slate-400 dark:text-white/30 text-xs">
            {allLocations.length} {t('totalLabel')}
          </p>
        </div>
        {!isSpy && currentLocation && (
          <span className="badge-violet text-xs">📍 {t('yourRole')}</span>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('filterPlaceholder')}
        className="input-field mb-3 text-xs py-2"
      />

      {/* List */}
      <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <p className="text-slate-400 dark:text-white/30 text-sm text-center py-4 col-span-full">—</p>
        ) : (
          filtered.map((loc, i) => {
            const isCurrent = !isSpy && currentLocation?.name === loc;
            const isCrossed = crossedOut.has(loc);
            return (
              <motion.div
                key={loc}
                onClick={() => toggleCrossOut(loc)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center justify-center text-center p-3 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-md shadow-sm overflow-hidden ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10'
                    : isCrossed
                    ? 'bg-slate-100/50 dark:bg-white/5 border-transparent opacity-40 grayscale'
                    : 'bg-white/60 dark:bg-slate-800/60 border-white/20 dark:border-slate-700 hover:shadow-md hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {/* Strike-through line */}
                {isCrossed && (
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[3px] bg-red-500 rounded-full z-10 origin-left shadow-[0_0_8px_rgba(239,68,68,0.6)]" 
                  />
                )}
                
                {isCurrent && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
                
                <span className={`text-sm font-semibold transition-colors z-0 ${
                  isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {loc}
                </span>
                {isCurrent && (
                  <span className="text-[9px] uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                    {t('hereLabel')}
                  </span>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Spy tip */}
      {isSpy && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-300/50 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-xl">
          <p className="text-rose-500 dark:text-rose-400 text-xs text-center">{t('spyReminder')}</p>
        </div>
      )}
    </div>
  );
}
