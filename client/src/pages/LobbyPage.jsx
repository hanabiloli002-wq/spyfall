import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

const AVATAR_STYLES = [
  { id: 'adventurer', icon: '🤠' },
  { id: 'bottts', icon: '🤖' },
  { id: 'fun-emoji', icon: '😎' },
  { id: 'lorelei', icon: '👩‍🎨' }
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function LobbyPage() {
  const { actions, state } = useGame();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [avatarSeed, setAvatarSeed] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCode(roomParam.toUpperCase().trim());
    }
  }, []);
  
  const debouncedName = useDebounce(name, 350);
  
  const currentSeed = avatarSeed || debouncedName || 'spy';
  const avatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(currentSeed)}&backgroundColor=transparent`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    actions.joinRoom(code.toUpperCase().trim(), name.trim(), avatar);
  };

  const rerollAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const containerV = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemV = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 24 } },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={containerV}
        initial="hidden"
        animate="visible"
      >
        {/* ── Logo ─── */}
        <motion.div variants={itemV} className="text-center mb-10">
          <motion.div
            className="text-7xl mb-4 inline-block"
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          >🕵️</motion.div>
          <h1 className="text-6xl font-black gradient-text tracking-tighter leading-none mb-2">
            SPYFALL
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/30 uppercase tracking-[0.22em]">
            {t('tagline')}
          </p>
        </motion.div>

        {/* ── Card ─── */}
        <motion.div variants={itemV} className="glass-card p-7">
          {/* Avatar preview */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              key={avatar}
              initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative mb-3 cursor-pointer"
              onClick={rerollAvatar}
              title={t('reroll')}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-violet-500/40 bg-violet-100 dark:bg-violet-950/60 shadow-lg">
                <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>
              <motion.div
                whileHover={{ rotate: 90 }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm text-white shadow-md border-2 border-white dark:border-slate-800"
              >
                🔄
              </motion.div>
            </motion.div>
            
            <div className="flex gap-2">
              {AVATAR_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setAvatarStyle(style.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                    avatarStyle === style.id 
                      ? 'bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-500/20' 
                      : 'bg-slate-50 dark:bg-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                  }`}
                  title={style.id}
                >
                  {style.icon}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="player-name-input"
                className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40"
              >
                {t('yourName')}
              </label>
              <input
                id="player-name-input"
                type="text"
                autoComplete="off"
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="input-field"
                maxLength={20}
                required
              />
            </div>

            {/* Room Code */}
            <div>
              <label
                htmlFor="room-code-input"
                className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40"
              >
                {t('roomCode')}
              </label>
              <div className="flex gap-2">
                <input
                  id="room-code-input"
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder={t('roomCodePlaceholder')}
                  className="input-field font-mono tracking-[0.2em] uppercase text-center"
                  maxLength={8}
                  required
                />
                <motion.button
                  type="button"
                  onClick={() => setCode(generateCode())}
                  className="flex-shrink-0 w-11 h-[46px] rounded-xl border text-lg flex items-center justify-center
                             bg-slate-100 border-slate-200 text-slate-500
                             dark:bg-white/8 dark:border-white/15 dark:text-white/60
                             hover:scale-110 transition-all"
                  whileHover={{ rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  title={t('roomCode')}
                >🎲</motion.button>
              </div>
            </div>

            {/* Error */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
              >
                <span className="text-rose-500 text-sm">⚠</span>
                <p className="text-rose-500 dark:text-rose-400 text-sm">{state.error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              id="join-room-btn"
              type="submit"
              disabled={!name.trim() || !code.trim() || state.loading}
              className="btn-primary w-full text-base py-3.5"
              whileHover={!state.loading ? { scale: 1.02 } : {}}
              whileTap={!state.loading ? { scale: 0.98 } : {}}
            >
              {state.loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('joiningBtn')}
                </span>
              ) : t('joinBtn')}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p variants={itemV} className="text-center text-slate-400 dark:text-white/20 text-xs mt-5">
          {t('firstPlayerNote')}
        </motion.p>

        {/* Feature pills */}
        <motion.div variants={itemV} className="flex gap-2 justify-center mt-4 flex-wrap">
          {t('features').map(f => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-xs
                         bg-slate-100 border border-slate-200 text-slate-500
                         dark:bg-white/5 dark:border-white/10 dark:text-white/30"
            >
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
