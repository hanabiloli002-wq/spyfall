import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import socket from '../socket';

const RADIUS = 52;
const CIRC   = 2 * Math.PI * RADIUS;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function Timer({ size = 'md' }) {
  const { state, actions }  = useGame();
  const { t }      = useLanguage();
  const { settings } = state;

  const [localTimeLeft, setLocalTimeLeft] = useState(settings?.timerMinutes * 60 || 0);
  const [localTimerRunning, setLocalTimerRunning] = useState(settings?.autoStartTimer ?? true);

  useEffect(() => {
    const onTimerSync = ({ timeLeft, timerRunning }) => {
      setLocalTimeLeft(timeLeft);
      setLocalTimerRunning(timerRunning);
    };
    
    socket.on('timer_sync', onTimerSync);
    return () => socket.off('timer_sync', onTimerSync);
  }, []);

  const total    = (settings?.timerMinutes || 8) * 60;
  const progress = total > 0 ? localTimeLeft / total : 0;

  const isUrgent = localTimeLeft <= 30 && localTimeLeft > 0;
  const isDanger = localTimeLeft <= 10 && localTimeLeft > 0;

  const color = useMemo(() => {
    if (isDanger) return '#f43f5e';
    if (isUrgent) return '#f59e0b';
    return '#10b981';
  }, [isUrgent, isDanger]);

  const svgSz  = size === 'sm' ? 80  : 130;
  const r      = size === 'sm' ? 32  : RADIUS;
  const circ   = 2 * Math.PI * r;
  const sw     = size === 'sm' ? 5   : 8;
  const cx     = svgSz / 2;
  const cy     = svgSz / 2;
  const offset = circ * (1 - progress);

  return (
    <div className="flex flex-col items-center select-none">
      <motion.div
        className="relative"
        animate={isUrgent ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={isUrgent ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : {}}
      >
        {isUrgent && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}`, animation: 'pulse-ring 1.5s ease-out infinite', opacity: 0.5 }}
          />
        )}

        <svg width={svgSz} height={svgSz} className="-rotate-90" aria-label={`Timer: ${fmt(localTimeLeft)}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={sw} className="dark:[stroke:rgba(255,255,255,0.08)]" />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold tabular-nums ${size === 'sm' ? 'text-base' : 'text-2xl'}`}
            style={{ color, textShadow: `0 0 16px ${color}88` }}
          >
            {fmt(localTimeLeft)}
          </span>
        </div>
      </motion.div>

      {size !== 'sm' && (
        <p className="text-slate-400 dark:text-white/30 text-xs mt-1 uppercase tracking-widest">
          {t('timeLeft')}
        </p>
      )}

      {/* Host Controls */}
      {size !== 'sm' && state.isHost && (
        <button
          onClick={() => actions.toggleTimer()}
          className={`mt-4 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            localTimerRunning
              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 border border-rose-500/30'
              : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-105 active:scale-95'
          }`}
          title={localTimerRunning ? 'Pause Timer' : 'Resume Timer'}
        >
          {localTimerRunning ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      )}
    </div>
  );
}
