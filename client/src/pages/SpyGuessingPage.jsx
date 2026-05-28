import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function SpyGuessingPage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // Listen to vote_timer_sync for countdown
  useEffect(() => {
    // The server sends vote_timer_sync with timeLeft during spy_guessing phase
    // We use state's timer data if available
  }, []);

  const handleGuess = () => {
    if (selectedLocation) {
      actions.spyGuess(selectedLocation.name || selectedLocation);
    }
  };

  if (!state.gameResult) {
    return <div className="text-white text-center mt-20">{t('loading') || '...'}</div>;
  }

  const { accusedPlayer, spyPlayer } = state.gameResult;
  const spyName = accusedPlayer?.name || spyPlayer?.name || '???';

  // Am I the spy who got caught?
  const amISpy = state.isSpy;

  // Get locations from state (set during GAME_STARTED)
  const locations = state.allLocations || [];

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-16 px-4 pb-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          {/* Icon */}
          <motion.div
            className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-4xl">🔒</span>
          </motion.div>

          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            {t('spyCaughtTitle')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {t('spyCaughtDesc', spyName)}
          </p>

          {amISpy ? (
            <p className="text-md text-amber-500 dark:text-amber-400 font-semibold mt-3">
              {t('spyLastChance')}
            </p>
          ) : (
            <p className="text-md text-emerald-500 dark:text-emerald-400 font-semibold mt-3">
              {t('waitingSpyGuess')}
            </p>
          )}
        </div>

        {amISpy && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 text-center">
              {t('selectLocation')}
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {locations.map((loc, idx) => {
                const locName = typeof loc === 'string' ? loc : loc.name;
                const isSelected = selectedLocation && 
                  (typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name) === locName;
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02] border-amber-400'
                        : 'bg-white/10 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-slate-700 border-white/10 dark:border-slate-700'
                    }`}
                  >
                    {locName}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleGuess}
              disabled={!selectedLocation}
              className="w-full py-4 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
            >
              {t('submitGuess')}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
