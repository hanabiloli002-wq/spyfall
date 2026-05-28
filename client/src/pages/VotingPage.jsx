import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function VotingPage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const { players, votes, hasVoted, settings } = state;

  const getVoteData = (id) => votes.find(v => v.targetId === id) || { voteCount: 0, voters: [] };
  const getCount = (id) => getVoteData(id).voteCount;
  const totalVotes = votes.reduce((s, v) => s + v.voteCount, 0);
  const maxVotes   = Math.max(...players.map(p => getCount(p.id)), 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl">

        {/* ── Header ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="text-center mb-8"
        >
          <motion.div
            className="text-5xl mb-3"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >🗳️</motion.div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            {t('voteTitle')} <span className="gradient-text-rose">{t('voteSpy')}</span>
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm">
            {hasVoted ? t('voteCastMsg') : t('voteInstruction')}
          </p>
        </motion.div>

        {/* ── Player cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {players.map((player, i) => {
            const count     = getCount(player.id);
            const isLeading = count > 0 && count === maxVotes;

            return (
              <motion.button
                key={player.id}
                id={`vote-btn-${player.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 250, damping: 22 }}
                onClick={() => !hasVoted && actions.castVote(player.id)}
                disabled={hasVoted}
                className={`glass-card p-4 flex flex-col items-center text-center transition-all duration-200 relative overflow-hidden ${
                  !hasVoted ? 'hover:bg-slate-50/50 dark:hover:bg-white/10 cursor-pointer' : 'cursor-default'
                } ${isLeading ? 'border-rose-500/60' : ''}`}
                style={isLeading ? { boxShadow: '0 0 20px rgba(244,63,94,0.2)' } : {}}
                whileHover={!hasVoted ? { scale: 1.05, y: -2 } : {}}
                whileTap={!hasVoted ? { scale: 0.95 } : {}}
              >
                {isLeading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-2 right-2 text-xs text-rose-500"
                  >⬆</motion.div>
                )}

                <div className={`w-14 h-14 rounded-full overflow-hidden mb-2 ring-2 transition-all ${
                  isLeading ? 'ring-rose-500/60' : 'ring-slate-200 dark:ring-white/15'
                }`}>
                  <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                </div>

                <p className="text-slate-800 dark:text-white font-semibold text-sm mb-2">{player.name}</p>

                <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full mb-1 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isLeading ? 'bg-rose-500' : 'bg-slate-300 dark:bg-white/30'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: totalVotes > 0 ? `${(count / players.length) * 100}%` : '0%' }}
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
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {getVoteData(player.id).voters.map(voter => (
                      <div key={voter.id} className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-white/20" title={voter.name}>
                        <img src={voter.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${voter.name}`} alt={voter.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
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
            <span className="text-slate-800 dark:text-white font-semibold">{totalVotes} / {players.length}</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(totalVotes / Math.max(players.length, 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {hasVoted && totalVotes < players.length && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-400 dark:text-white/30 text-xs text-center mt-2"
            >
              {t('waitingFor')} {players.length - totalVotes} {players.length - totalVotes !== 1 ? t('moreVotes') : t('moreVote')}...
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
