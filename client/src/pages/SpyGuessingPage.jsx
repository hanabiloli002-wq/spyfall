import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function SpyGuessingPage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleGuess = () => {
    if (selectedLocation) {
      actions.spyGuess(selectedLocation.name);
    }
  };

  if (!state.gameResult) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  const { targetName, isSpy } = state.gameResult;

  // The player who is currently viewing this page
  const amISpy = state.myRole === 'Spy';

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-16 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-6 sm:p-8"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            Spy Caught!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            {targetName} was the Spy.
          </p>
          {amISpy ? (
            <p className="text-md text-amber-500 dark:text-amber-400 font-semibold mt-2">
              You have one last chance to win. Guess the location!
            </p>
          ) : (
            <p className="text-md text-emerald-500 dark:text-emerald-400 font-semibold mt-2">
              Waiting for the Spy to guess the location...
            </p>
          )}
        </div>

        {amISpy && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">
              Select the Location
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {state.allLocations && state.allLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    selectedLocation?.name === loc.name
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleGuess}
              disabled={!selectedLocation}
              className="w-full py-4 mt-6 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              Submit Guess
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
