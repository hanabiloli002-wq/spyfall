import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function PostGameDossier({ gameResult, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0); // 0 = typing, 1 = summary, 2 = details

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 2000); // typing effect duration
    const timer2 = setTimeout(() => setStep(2), 3500); // summary show duration
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  if (!gameResult) return null;

  const {
    type,
    spyFound,
    correct,
    accusedPlayer,
    spyPlayer,
    spies,
    location,
    guessedLocation,
    votes,
    durationStr,
    achievements
  } = gameResult;

  let title = '';
  let subTitle = '';
  let isVictory = false;

  if (type === 'vote') {
    if (spyFound) {
      title = 'SPY APPREHENDED';
      subTitle = 'The detective team successfully identified the spy.';
      isVictory = true; // Detective win
    } else {
      title = 'SPY ESCAPED';
      subTitle = accusedPlayer 
        ? `Innocent ${accusedPlayer.name} was framed.` 
        : 'The detectives failed to find the spy.';
      isVictory = false; // Spy win
    }
  } else if (type === 'spy_guess') {
    if (correct) {
      title = 'SPY ESCAPED';
      subTitle = `The spy correctly guessed: ${guessedLocation}.`;
      isVictory = false; // Spy win
    } else {
      title = 'SPY APPREHENDED';
      subTitle = `The spy guessed incorrectly: ${guessedLocation}.`;
      isVictory = true; // Detective win
    }
  }

  const allSpies = spies || (spyPlayer ? [spyPlayer] : []);
  const allSpiesNames = allSpies.map(s => s.name).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200"
      >
        {/* Header Ribbon */}
        <div className={`h-2 w-full ${isVictory ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center mb-8 min-h-[120px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-2xl tracking-widest text-emerald-400"
                >
                  DECRYPTING MISSION LOG...
                </motion.div>
              )}
              
              {step >= 1 && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-widest ${isVictory ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {title}
                  </h1>
                  <p className="text-lg text-slate-400 font-medium">{subTitle}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6"
              >
                {/* Mission Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">True Location</div>
                    <div className="text-xl font-bold text-white">{location?.name || '?'}</div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mission Duration</div>
                    <div className="text-xl font-bold text-white">{durationStr || 'Unknown'}</div>
                  </div>
                  <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 col-span-2 flex items-center gap-4">
                    <div className="text-3xl">🕵️‍♂️</div>
                    <div>
                      <div className="text-xs text-rose-400 uppercase tracking-wider mb-1">Identified Spies</div>
                      <div className="text-xl font-bold text-rose-500">{allSpiesNames || '?'}</div>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                {achievements && achievements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-3">🎖️ Mission Commendations</h3>
                    <div className="flex flex-wrap gap-2">
                      {achievements.map((ach, i) => (
                        <div key={i} className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-sm text-amber-200">
                          <span className="font-bold">{ach.name}</span>: {ach.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voting History */}
                {type === 'vote' && votes && votes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-3">📊 Voting Record</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {votes.sort((a,b) => b.voteCount - a.voteCount).map((v, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/40 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{v.targetName}</span>
                            <span className="text-xs text-slate-500">received {v.voteCount} vote{v.voteCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex -space-x-2">
                            {v.voters.map((voter, j) => (
                              <div key={j} className="w-6 h-6 rounded-full bg-slate-600 border border-slate-800 flex items-center justify-center text-[10px] overflow-hidden" title={voter.name}>
                                {voter.avatarUrl ? <img src={voter.avatarUrl} alt="" className="w-full h-full object-cover" /> : voter.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors shadow-lg"
                  >
                    RETURN TO LOBBY
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
