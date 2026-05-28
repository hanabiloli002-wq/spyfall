import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import PlayerGrid from '../components/PlayerGrid';
import { useSound } from '../hooks/useSound';

// ─── Confetti ─────────────────────────────────────────────────────────────
function Confetti({ count = 30 }) {
  const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length], left: `${Math.random() * 100}%`, top: '-10px' }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, Math.random() * 720 - 360], opacity: [1, 1, 0], x: [0, (Math.random() - 0.5) * 200] }}
          transition={{ duration: 2.5 + Math.random() * 2, delay: Math.random() * 1.5, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const { gameResult, isHost, isSpy } = state;
  const [revealed, setRevealed] = useState(false);
  const { playReveal, playWin, playLose } = useSound();

  const { type, spyFound, spyPlayer, location, accusedPlayer, correct, guessedLocation, guessResult, allPlayers } = gameResult || {};

  const spyWins = guessResult === 'timeout' ? false : (type === 'vote' ? !spyFound : correct);
  const playersWin = !spyWins;
  const iWon = isSpy ? spyWins : playersWin;

  useEffect(() => {
    if (!gameResult) return;
    setRevealed(false);
    playReveal();
    const t = setTimeout(() => {
      setRevealed(true);
      if (iWon) playWin();
      else playLose();
    }, 2500);
    return () => clearTimeout(t);
  }, [gameResult, iWon, playReveal, playWin, playLose]);

  if (!gameResult) return null;

  if (!revealed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-8xl mb-6 drop-shadow-2xl"
        >
          🎭
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-slate-400 dark:text-white/50 tracking-[0.2em] uppercase"
        >
          Revealing Results...
        </motion.h2>
      </div>
    );
  }

  const winnerEmoji = spyWins ? '🕵️' : '👥';
  const winnerTitle = spyWins ? t('spyWins') : t('playersWin');
  const winnerColor = spyWins ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
  const borderColor = spyWins ? 'border-rose-500/40' : 'border-emerald-500/40';
  const glowStyle   = spyWins
    ? { boxShadow: '0 0 60px rgba(244,63,94,0.15)' }
    : { boxShadow: '0 0 60px rgba(16,185,129,0.15)' };

  const subtitle = (() => {
    if (guessResult === 'timeout') {
      return "The Spy ran out of time to guess the location!";
    }
    if (type === 'vote') {
      return spyFound
        ? t('spyFoundMsg',  accusedPlayer?.name ?? '?')
        : t('innocentMsg',  accusedPlayer?.name ?? '?');
    }
    return correct
      ? t('correctGuessMsg', spyPlayer?.name ?? '?')
      : t('wrongGuessMsg',   spyPlayer?.name ?? '?');
  })();

  const displayPlayers = allPlayers ?? state.players;

  return (
    <div className="min-h-screen p-4 py-8">
      {playersWin && <Confetti />}

      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Winner card ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className={`glass-card p-8 text-center ${borderColor}`}
          style={glowStyle}
        >
          <motion.div
            className="text-7xl mb-4 inline-block"
            animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.15, 1] }}
            transition={{ delay: 0.3, duration: 0.9 }}
          >{winnerEmoji}</motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`text-4xl font-black mb-2 ${winnerColor}`}
          >{winnerTitle}</motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 dark:text-white/55 mb-6"
          >{subtitle}</motion.p>

          {spyPlayer && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-5 py-3"
            >
              <img src={spyPlayer.avatarUrl} alt={spyPlayer.name}
                className="w-11 h-11 rounded-full ring-2 ring-rose-500/40" />
              <div className="text-left">
                <p className="text-rose-500 dark:text-rose-400 text-xs uppercase tracking-widest">{t('theSpyWas')}</p>
                <p className="text-slate-800 dark:text-white font-bold text-lg leading-tight">{spyPlayer.name}</p>
              </div>
              <span className="text-3xl">🕵️</span>
            </motion.div>
          )}
        </motion.div>

        {/* ── Location reveal ─── */}
        {location && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-slate-500 dark:text-white/30 text-xs uppercase tracking-widest mb-1">{t('secretLocation')}</p>
            <p className="gradient-text text-2xl font-black">{location.name}</p>
            {type === 'spy_guess' && (
              <p className="text-slate-400 dark:text-white/35 text-sm mt-1">
                {t('spyGuessed')}{' '}
                <span className={correct ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 dark:text-rose-400 font-semibold'}>
                  {guessedLocation}
                </span>
              </p>
            )}
          </motion.div>
        )}

        {/* ── Vote Results (If ended by vote) ─── */}
        {type === 'vote' && gameResult.votes && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-5"
          >
            <p className="text-slate-500 dark:text-white/30 text-xs uppercase tracking-widest mb-4">{t('votes') || 'Voting Results'}</p>
            <div className="space-y-3">
              {gameResult.votes.filter(v => v.voteCount > 0).sort((a, b) => b.voteCount - a.voteCount).map(v => (
                <div key={v.targetId} className="flex flex-col bg-slate-50/50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">{v.targetName}</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-white/40">{v.voteCount} {t('votes')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.voters.map(voter => (
                      <div key={voter.id} className="flex items-center gap-1.5 bg-white dark:bg-black/20 px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-white/10">
                        <img src={voter.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${voter.name}`} className="w-4 h-4 rounded-full" alt={voter.name} />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-white/60">{voter.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── All roles ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-5"
        >
          <p className="text-slate-500 dark:text-white/30 text-xs uppercase tracking-widest mb-4">{t('everyonesRoles')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.07 }}
                className={`flex flex-col items-center text-center p-3 rounded-xl ${
                  player.isSpy
                    ? 'bg-rose-500/10 border border-rose-500/20'
                    : 'bg-slate-50 border border-slate-200 dark:bg-white/4 dark:border-white/8'
                }`}
              >
                <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full mb-1.5 ring-2 ring-slate-200 dark:ring-white/15" />
                <p className="text-slate-800 dark:text-white text-xs font-semibold mb-0.5 truncate w-full">{player.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  player.isSpy
                    ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10'
                    : 'text-violet-700 dark:text-violet-300 bg-violet-500/10'
                }`}>
                  {player.isSpy ? '🕵️ Spy' : player.role || '?'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex gap-3"
        >
          {isHost && (
            <button id="play-again-btn" onClick={actions.playAgain} className="flex-1 btn-primary py-3.5 text-base">
              {t('playAgain')}
            </button>
          )}
          <button id="leave-game-btn" onClick={actions.leaveRoom} className="flex-1 btn-secondary py-3.5 text-base">
            {t('leaveGame')}
          </button>
        </motion.div>

        {!isHost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center text-slate-400 dark:text-white/20 text-xs"
          >
            {t('waitingHostNewRound')}
          </motion.p>
        )}
      </div>
    </div>
  );
}
