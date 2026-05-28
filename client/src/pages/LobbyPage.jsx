import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import socket from '../socket';

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
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'create'
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCode(roomParam.toUpperCase().trim());
      setActiveTab('join');
    }
  }, []);
  
  // Request room list on mount
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('get_room_list');
    
    // Poll every 10s just in case
    const interval = setInterval(() => socket.emit('get_room_list'), 10000);
    return () => clearInterval(interval);
  }, []);
  
  const debouncedName = useDebounce(name, 350);
  
  const currentSeed = avatarSeed || debouncedName || 'spy';
  const avatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(currentSeed)}&backgroundColor=transparent`;

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    actions.joinRoom(code.toUpperCase().trim(), name.trim(), avatar);
  };
  
  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newCode = generateCode();
    actions.joinRoom(newCode, name.trim(), avatar, roomName.trim() || `${name.trim()}'s Room`, isPrivate);
  };
  
  const joinPublicRoom = (roomId) => {
    if (!name.trim()) {
      document.getElementById('player-name-input')?.focus();
      return;
    }
    actions.joinRoom(roomId, name.trim(), avatar);
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
        <motion.div variants={itemV} className="text-center mb-8">
          <motion.div
            className="text-7xl mb-4 inline-block"
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          >🕵️</motion.div>
          <h1 className="text-6xl font-black gradient-text tracking-tighter leading-none mb-2">
            SPYFALL
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/30 uppercase tracking-[0.22em]">
            {t('tagline') || 'Find the spy before time runs out'}
          </p>
        </motion.div>

        {/* ── Card ─── */}
        <motion.div variants={itemV} className="glass-card p-6">
          {/* Avatar preview */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              key={avatar}
              initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative mb-3 cursor-pointer"
              onClick={rerollAvatar}
              title={t('reroll') || 'Reroll Avatar'}
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
          
          {/* Global Name Input */}
          <div className="mb-6">
            <label
              htmlFor="player-name-input"
              className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40"
            >
              {t('yourName') || 'Your Name'}
            </label>
            <input
              id="player-name-input"
              type="text"
              autoComplete="off"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder') || 'Enter your name...'}
              className="input-field"
              maxLength={20}
              required
            />
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'join' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              onClick={() => setActiveTab('join')}
            >
              Join Game
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'create' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              onClick={() => setActiveTab('create')}
            >
              Create Game
            </button>
          </div>

          {/* Join Tab */}
          {activeTab === 'join' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40">
                  Public Rooms
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {state.publicRooms && state.publicRooms.length > 0 ? (
                    state.publicRooms.map(room => (
                      <div key={room.id} onClick={() => joinPublicRoom(room.id)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-violet-50 dark:hover:bg-white/10 hover:border-violet-200 transition-all">
                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-slate-800 dark:text-white truncate">{room.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-white/50">Host: {room.hostName}</p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                          <span className="text-xs font-mono text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                            {room.playerCount}/{room.maxPlayers}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 dark:text-white/30 text-sm italic">
                      No public rooms found.
                    </div>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleJoin}>
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40">
                    Or enter private code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder={t('roomCodePlaceholder')}
                    className="input-field font-mono tracking-[0.2em] uppercase text-center"
                    maxLength={8}
                  />
                </div>
                
                {/* Error */}
                {state.error && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl mb-4">
                    <span className="text-rose-500 text-sm">⚠</span>
                    <p className="text-rose-500 dark:text-rose-400 text-sm">{state.error}</p>
                  </motion.div>
                )}

                <motion.button type="submit" disabled={!name.trim() || !code.trim() || state.loading} className="btn-primary w-full text-base py-3.5" whileHover={!state.loading ? { scale: 1.02 } : {}} whileTap={!state.loading ? { scale: 0.98 } : {}}>
                  {state.loading ? t('joiningBtn') : t('joinBtn')}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-widest mb-1.5 text-slate-500 dark:text-white/40">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder={`${name.trim() || 'My'}'s Room`}
                    className="input-field"
                    maxLength={30}
                  />
                </div>
                
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Private Room</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hide from public list</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {/* Error */}
                {state.error && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl mb-4">
                    <span className="text-rose-500 text-sm">⚠</span>
                    <p className="text-rose-500 dark:text-rose-400 text-sm">{state.error}</p>
                  </motion.div>
                )}

                <motion.button type="submit" disabled={!name.trim() || state.loading} className="btn-primary w-full text-base py-3.5" whileHover={!state.loading ? { scale: 1.02 } : {}} whileTap={!state.loading ? { scale: 0.98 } : {}}>
                  {state.loading ? t('joiningBtn') : 'Create Game'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
