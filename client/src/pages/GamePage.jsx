import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import Timer from '../components/Timer';
import RoleCard from '../components/RoleCard';
import LocationList from '../components/LocationList';
import Modal from '../components/ui/Modal';
import { useSound } from '../hooks/useSound';
import GameChat from '../components/GameChat';
import { useAmbientAudio } from '../hooks/useAmbientAudio';
import PostGameDossier from '../components/PostGameDossier';

export default function GamePage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const { isSpy, allLocations, players, firstPlayerId, myRole, playerName, phase, gameResult, fullLocationData, fullSpyData, fullPlayersRoles, settings } = state;
  const [showGuess, setShowGuess] = useState(false);
  const [guess, setGuess] = useState('');
  const [emergencyVoteData, setEmergencyVoteData] = useState(null);
  const { playStart } = useSound();
  const isSpectator = myRole === 'Spectator';
  
  const { isMuted, toggleMute } = useAmbientAudio(isSpy, phase === 'playing', fullLocationData?.name || state.currentLocation?.name, isSpectator);

  useEffect(() => {
    playStart();
  }, [playStart]);

  useEffect(() => {
    import('../socket').then(({ default: socket }) => {
      const onEmergencyUpdate = (data) => setEmergencyVoteData(data);
      socket.on('emergency_vote_update', onEmergencyUpdate);
      return () => socket.off('emergency_vote_update', onEmergencyUpdate);
    });
  }, []);

  const firstPlayer = players.find(p => p.id === firstPlayerId);
  const isMeFirst = firstPlayer && firstPlayer.name === playerName;
  
  const activeTheme = settings.locationSets?.length === 1 ? `theme-${settings.locationSets[0]}` : 'theme-standard';

  const confirmGuess = () => {
    if (!guess) return;
    actions.spyGuess(guess);
    setShowGuess(false);
  };

  return (
    <div className={`min-h-screen p-3 py-5 ${activeTheme}`}>
      <div className="max-w-5xl mx-auto space-y-4 relative z-10">
        
        {phase === 'ended' && <PostGameDossier gameResult={gameResult} onClose={actions.playAgain} />}

        {/* ── Top bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <div>
              <p className="text-slate-800 dark:text-white font-semibold text-sm">{t('gameInProgress')}</p>
              <p className="text-slate-400 dark:text-white/30 text-xs">{players.length} {t('players').toLowerCase()}</p>
            </div>
          </div>
          
          <button 
            onClick={toggleMute}
            className="text-xl p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            title="Toggle Ambient Audio"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <Timer size="md" />

          <div className="flex flex-col gap-2 items-end">
            {!isSpectator && (
              <div className="flex flex-col items-end gap-1">
                <motion.button
                  id="emergency-vote-btn"
                  onClick={actions.triggerVote}
                  className={`btn-danger px-4 py-2 text-sm ${emergencyVoteData?.voters?.includes(state.socketId) ? 'bg-rose-700/80' : ''}`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {emergencyVoteData?.voters?.includes(state.socketId)
                    ? `${t('cancelVote') || 'Cancel Vote'} (${emergencyVoteData.count}/${emergencyVoteData.required})`
                    : emergencyVoteData
                      ? `${t('emergencyVote')} (${emergencyVoteData.count}/${emergencyVoteData.required})` 
                      : t('emergencyVote')}
                </motion.button>
                {emergencyVoteData?.voters?.length > 0 && (
                  <div className="flex -space-x-2 mt-1">
                    {emergencyVoteData.voters.map(vid => {
                      const vPlayer = state.players.find(p => p.id === vid);
                      return vPlayer ? (
                        <div key={vid} className="w-6 h-6 rounded-full overflow-hidden border-2 border-[#0a0f1e]" title={vPlayer.name}>
                          <img src={vPlayer.avatarUrl} alt={vPlayer.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
            {isSpy && !isSpectator && (
              <motion.button
                id="spy-guess-btn"
                onClick={() => { setGuess(''); setShowGuess(true); }}
                className="btn-secondary px-4 py-2 text-sm"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {t('guessLocation')}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── Main grid ─── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* LEFT */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-slate-400 dark:text-white/35 text-xs uppercase tracking-widest mb-2 px-1">
                {t('yourIdentity')}
              </p>
              <RoleCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4"
            >
              <p className="text-slate-400 dark:text-white/35 text-xs uppercase tracking-widest mb-3">
                {t('playersThisRound')}
              </p>
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full ring-1 ring-slate-200 dark:ring-white/15" />
                    <span className="text-slate-700 dark:text-white/80 text-sm font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT */}
          {!isSpectator ? (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
              className="min-h-[400px]"
            >
              <LocationList />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
              className="flex flex-col h-full space-y-4"
            >
              <div className="glass-card p-6 flex flex-col items-center justify-center text-center border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <span className="text-4xl mb-3">👁️</span>
                <p className="text-xl font-black text-amber-500 mb-1 uppercase tracking-widest">Omniscient Mode</p>
                <p className="text-sm text-slate-500 dark:text-white/40 mb-4 font-bold text-rose-500">Do NOT spoil the game!</p>
                
                <div className="w-full bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50 mb-4">
                   <div className="text-xs text-slate-500 uppercase mb-1">True Location</div>
                   <div className="text-lg font-bold text-white">{fullLocationData?.name || '?'}</div>
                </div>

                <div className="w-full bg-slate-800/50 rounded-xl p-4 text-left border border-slate-700/50">
                   <div className="text-xs text-slate-500 uppercase mb-3">Player Roles</div>
                   <div className="space-y-2">
                     {fullPlayersRoles?.filter(p => p.role !== 'Spectator').map(p => (
                       <div key={p.id} className="flex justify-between items-center bg-slate-700/30 p-2 rounded-lg">
                         <span className="text-white font-medium">{players.find(x => x.id === p.id)?.name || 'Unknown'}</span>
                         <span className={`text-sm font-bold ${p.isSpy ? 'text-rose-500' : 'text-emerald-400'}`}>
                           {p.isSpy ? 'SPY' : p.role}
                         </span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* First Question Banner */}
        {firstPlayer && !isSpectator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className={`glass-card p-4 border flex items-center justify-center gap-3 ${
              isMeFirst ? 'bg-violet-500/10 border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'border-emerald-500/30 bg-emerald-500/5'
            }`}
          >
            <span className="text-3xl">{isMeFirst ? '🎯' : '🎲'}</span>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/40 mb-1">First Question</p>
              <p className={`text-lg font-black ${isMeFirst ? 'text-violet-600 dark:text-violet-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {isMeFirst ? 'คุณเป็นคนเริ่มถามคำถามแรก!' : `👉 ${firstPlayer.name} เริ่มถามคำถามแรก!`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Spy banner */}
        {isSpy && !isSpectator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-3 border-rose-500/30 flex items-center gap-3"
            style={{ boxShadow: '0 0 20px rgba(244,63,94,0.12)' }}
          >
            <span className="text-2xl">🕵️</span>
            <div>
              <p className="text-rose-500 dark:text-rose-300 font-semibold text-sm">{t('spyTipTitle')}</p>
              <p className="text-slate-500 dark:text-white/40 text-xs">{t('spyTipDesc')}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Spy guess modal ─── */}
      <AnimatePresence>
        {showGuess && (
          <Modal title={t('guessModalTitle')} onClose={() => setShowGuess(false)}>
            <p className="text-slate-500 dark:text-white/45 text-sm mb-4">{t('guessModalDesc')}</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto mb-4">
              {allLocations.map(loc => (
                <motion.button
                  key={loc}
                  onClick={() => setGuess(loc)}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${
                    guess === loc
                      ? 'bg-violet-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {loc}
                </motion.button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuess(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm"
              >
                {t('cancel')}
              </button>
              <button
                id="confirm-spy-guess-btn"
                onClick={confirmGuess}
                disabled={!guess}
                className="flex-1 btn-primary py-2.5 text-sm"
              >
                {t('confirmGuess')}: {guess || '...'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
