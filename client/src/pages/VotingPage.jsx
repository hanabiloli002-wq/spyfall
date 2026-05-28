import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function VotingPage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const { players, votes, settings, socketId } = state;

  const [timeLeft, setTimeLeft] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  // Find user's currently locked vote
  const myCurrentVoteId = votes.find(v => v.voters.some(voter => voter.id === socketId))?.targetId;

  useEffect(() => {
    import('../socket').then(({ default: socket }) => {
      const onVoteTimerSync = (data) => setTimeLeft(data.timeLeft);
      socket.on('vote_timer_sync', onVoteTimerSync);
      return () => socket.off('vote_timer_sync', onVoteTimerSync);
    });
  }, []);

  const getVoteData = (id) => votes.find(v => v.targetId === id) || { voteCount: 0, voters: [] };
  const getCount = (id) => getVoteData(id).voteCount;
  
  // Only count active players for voting percentage calculation
  const activePlayers = players.filter(p => p.role !== 'Spectator');
  const totalVotes = votes.reduce((s, v) => s + v.voteCount, 0);
  const maxVotes = Math.max(...activePlayers.map(p => getCount(p.id)), 0);

  const formatTime = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleConfirmVote = () => {
    if (!selectedPlayerId) return;
    actions.castVote(selectedPlayerId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl relative z-10">

        {/* ── Timer & Header ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="text-center mb-8 relative"
        >
          {timeLeft !== null && (
            <div className="absolute top-0 right-0 w-48 max-w-full">
              <div className="glass-card px-4 py-2 mb-2 border-rose-500/30 text-rose-500 font-bold text-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                <span>⏱️</span> {formatTime(timeLeft)}
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-rose-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${Math.max(0, (timeLeft / (state.votingTimeLimit || 60)) * 100)}%` }}
                  transition={{ ease: "linear", duration: 1 }}
                />
              </div>
            </div>
          )}
          <motion.div
            className="text-5xl mb-3"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >🗳️</motion.div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            {t('voteTitle')} <span className="gradient-text-rose">{t('voteSpy')}</span>
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm">
            {t('voteInstruction')}
          </p>
        </motion.div>

        {/* ── Player cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {activePlayers.map((player, i) => {
            const count = getCount(player.id);
            const isLeading = count > 0 && count === maxVotes;
            const isSelected = selectedPlayerId === player.id;
            const isMyVote = myCurrentVoteId === player.id;

            return (
              <motion.button
                key={player.id}
                id={`vote-btn-${player.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 250, damping: 22 }}
                onClick={() => setSelectedPlayerId(player.id)}
                className={`glass-card p-4 flex flex-col items-center text-center transition-all duration-200 relative overflow-hidden cursor-pointer ${
                  isSelected ? 'bg-violet-500/10 border-violet-500 ring-2 ring-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'hover:bg-slate-50/50 dark:hover:bg-white/10 border-transparent'
                } ${isMyVote && !isSelected ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLeading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-2 right-2 text-xs text-rose-500"
                  >⬆</motion.div>
                )}
                
                {isMyVote && (
                  <div className="absolute top-2 left-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {t('voted')}
                  </div>
                )}

                <div className={`w-14 h-14 rounded-full overflow-hidden mb-2 ring-2 transition-all mt-4 ${
                  isSelected ? 'ring-violet-500' : isMyVote ? 'ring-emerald-500' : 'ring-slate-200 dark:ring-white/15'
                }`}>
                  <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                </div>

                <p className="text-slate-800 dark:text-white font-semibold text-sm mb-2">{player.name}</p>

                <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full mb-1 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isLeading ? 'bg-rose-500' : 'bg-slate-300 dark:bg-white/30'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: totalVotes > 0 ? `${(count / activePlayers.length) * 100}%` : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <p className={`text-xs font-bold ${
                  count > 0
                    ? isLeading ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-white/60'
                    : 'text-slate-300 dark:text-white/20'
                }`}>
                  {count} {count === 1 ? t('vote') : t('votes')}
                </p>

                {/* Show who voted */}
                {settings.showVotes && count > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-2 min-h-[24px]">
                    {getVoteData(player.id).voters.map(voter => (
                      <div key={voter.id} className="w-6 h-6 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: voter.color || '#cbd5e1' }} title={voter.name}>
                        <img src={voter.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${voter.name}`} alt={voter.name} className="w-full h-full object-cover" style={{ backgroundColor: voter.color ? `${voter.color}20` : 'transparent' }} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* ── Confirm Button ─── */}
        <div className="flex justify-center mb-5">
          {myCurrentVoteId && myCurrentVoteId === selectedPlayerId ? (
            <motion.button
              onClick={() => { actions.castVote(null); setSelectedPlayerId(null); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl font-bold text-lg text-slate-700 bg-slate-200 hover:bg-slate-300 dark:text-white dark:bg-white/10 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              {t('cancelVote')}
            </motion.button>
          ) : (
            <motion.button
              disabled={!selectedPlayerId}
              onClick={handleConfirmVote}
              whileHover={selectedPlayerId ? { scale: 1.05 } : {}}
              whileTap={selectedPlayerId ? { scale: 0.95 } : {}}
              className={`px-8 py-3 rounded-xl font-bold text-lg text-white shadow-lg transition-all ${
                selectedPlayerId 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/40 cursor-pointer' 
                  : 'bg-slate-400 dark:bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {myCurrentVoteId ? t('changeVote') : t('confirmVote')} {selectedPlayerId && `${players.find(p => p.id === selectedPlayerId)?.name}`}
            </motion.button>
          )}
        </div>

        {/* ── Progress ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-500 dark:text-white/40">{t('votesCast')}</span>
            <span className="text-slate-800 dark:text-white font-semibold">{totalVotes} / {activePlayers.length}</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(totalVotes / Math.max(activePlayers.length, 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {totalVotes < activePlayers.length && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-400 dark:text-white/30 text-xs text-center mt-2"
            >
              {t('waitingFor')} {activePlayers.length - totalVotes} {activePlayers.length - totalVotes !== 1 ? t('moreVotes') : t('moreVote')}...
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
