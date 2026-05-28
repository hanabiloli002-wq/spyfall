import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import PlayerGrid from '../components/PlayerGrid';
import Modal from '../components/ui/Modal';
import LocationSelectionModal from '../components/LocationSelectionModal';
import { useSound } from '../hooks/useSound';
import { QRCodeSVG } from 'qrcode.react';

export default function WaitingRoom() {
  const { state, actions } = useGame();
  const { t } = useLanguage();
  const { roomId, players, settings, isHost } = state;
  const [copied, setCopied] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [customText, setCustomText] = useState('');

  // Sync state if settings arrive
  useEffect(() => {
    if (settings.customLocations) {
      setCustomText(settings.customLocations.join('\n'));
    }
  }, [settings.customLocations]);

  // Join Sound
  const { playJoin } = useSound();
  const prevPlayersRef = useRef(players.length);
  useEffect(() => {
    if (players.length > prevPlayersRef.current && prevPlayersRef.current > 0) {
      playJoin();
    }
    prevPlayersRef.current = players.length;
  }, [players.length, playJoin]);

  const hasScores = state.scores && Object.keys(state.scores).length > 0;
  const sortedScores = Object.entries(state.scores || {}).sort((a, b) => {
    const scoreA = (a[1].spyWins * 3) + a[1].detectiveWins;
    const scoreB = (b[1].spyWins * 3) + b[1].detectiveWins;
    return scoreB - scoreA;
  });

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=${roomId}` : roomId;

  const canStart = players.length >= 1 && settings.locationSets.length > 0;
  const maxSpies = 4; // Allow setting up to 4 spies beforehand. Server limits to actual players - 1.

  const LOCATION_SETS = [
    { id: 'standard1', name: t('setStandard1') },
    { id: 'standard2', name: t('setStandard2') },
    { id: 'standard3', name: t('setStandard3') },
    { id: 'fantasy',  name: t('setFantasy') },
    { id: 'scifi',    name: t('setScifi') },
    { id: 'custom',   name: t('setCustom') },
  ];

  const TIMERS = [5, 8, 10, 15];

  return (
    <div className="min-h-screen p-4 py-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('gameLobby')}</h1>
            <p className="text-slate-500 dark:text-white/35 text-sm">{t('waitingSubtitle')}</p>
          </div>

          {/* Room code badge & QR */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="glass-card px-4 py-2.5 flex items-center justify-center cursor-pointer group hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-2xl"
              title="Show QR Code"
            >
              📱
            </button>
            <motion.button
              id="copy-room-code-btn"
              onClick={copyCode}
              className="glass-card px-5 py-2.5 flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              title={t('roomCode')}
            >
              <div>
                <p className="text-slate-500 dark:text-white/30 text-xs uppercase tracking-widest leading-none mb-0.5">
                  {t('roomCode')}
                </p>
                <p className="text-violet-600 dark:text-violet-400 font-mono font-bold tracking-[0.2em] text-xl leading-none">
                  {roomId}
                </p>
              </div>
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="ck" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-emerald-500 text-lg">✓</motion.span>
                  : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-slate-400 dark:text-white/25 text-base">📋</motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Grid ─── */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* LEFT: Players */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-slate-800 dark:text-white font-semibold">{t('players')}</h2>
                  <span className="badge-slate">{players.length}/{settings.maxPlayers}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(settings.maxPlayers, 12) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < players.length ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/15'}`} />
                  ))}
                </div>
              </div>
              <PlayerGrid />
              {players.length < 2 && (
                <p className="text-slate-400 dark:text-white/25 text-xs text-center mt-4">{t('shareNote')}</p>
              )}

              {/* ── Scoreboard ─── */}
              {hasScores && (
                <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                  <h3 className="text-slate-800 dark:text-white font-semibold flex items-center gap-2 mb-4">
                    <span>🏆</span> กระดานคะแนน (Leaderboard)
                  </h3>
                  <div className="space-y-2">
                    {sortedScores.map(([name, scores], index) => {
                      const totalScore = (scores.spyWins * 3) + scores.detectiveWins;
                      return (
                        <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-400 w-5">{index + 1}.</span>
                            <span className="text-slate-700 dark:text-white font-medium">{name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-1 text-rose-500" title="ชนะในฐานะ Spy (3 คะแนน)">
                              <span>🕵️</span> {scores.spyWins}
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500" title="จับ Spy สำเร็จ (1 คะแนน)">
                              <span>👥</span> {scores.detectiveWins}
                            </div>
                            <div className="w-10 text-right text-violet-600 dark:text-violet-400 text-sm">{totalScore} pt</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {isHost ? (
              /* ── Host settings ─── */
              <div className="glass-card p-5">
                <h2 className="text-slate-800 dark:text-white font-semibold mb-5 flex items-center gap-2">
                  <span>⚙️</span> {t('gameSettings')}
                </h2>

                {/* Location sets */}
                <div className="mb-5">
                  <label className="text-slate-500 dark:text-white/35 text-xs uppercase tracking-widest mb-2 block">
                    {t('locationSets')}
                  </label>
                  <div className="space-y-2">
                    {LOCATION_SETS.map(set => {
                      const isActive = settings.locationSets.includes(set.id);
                      const selectedCount = settings.customLocationsSelection?.[set.id]?.length;
                      return (
                        <div key={set.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-violet-500/10 border-violet-500/30' 
                            : 'bg-slate-50 dark:bg-white/5 border-transparent opacity-70'
                        }`}>
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => {
                              const newSets = isActive 
                                ? settings.locationSets.filter(s => s !== set.id)
                                : [...settings.locationSets, set.id];
                              actions.updateSettings({ locationSets: newSets });
                            }}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isActive ? 'bg-violet-500 border-violet-500 text-white' : 'border-slate-300 dark:border-white/20'
                            }`}>
                              {isActive && '✓'}
                            </div>
                            <div>
                              <span className={`font-semibold text-sm block ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-white'}`}>
                                {set.name}
                              </span>
                              {isActive && (
                                <span className="text-xs text-violet-600/70 dark:text-violet-400/70 font-medium">
                                  {selectedCount ? `${selectedCount} locations selected` : 'Default (20 random locations)'}
                                </span>
                              )}
                            </div>
                          </div>
                          {isActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSet({ id: set.id, name: set.name }); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 transition-colors"
                              title="Edit Locations"
                            >
                              ⚙️
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Max players */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-500 dark:text-white/35 text-xs uppercase tracking-widest">
                      {t('maxPlayers')}
                    </label>
                    <span className="text-violet-600 dark:text-violet-400 text-sm font-bold">{settings.maxPlayers}</span>
                  </div>
                  <input type="range" min={3} max={12} value={settings.maxPlayers}
                    onChange={e => actions.updateSettings({ maxPlayers: +e.target.value })} className="w-full" />
                </div>

                {/* Spies */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-500 dark:text-white/35 text-xs uppercase tracking-widest">
                      {t('spies')}
                    </label>
                    <span className="text-rose-500 dark:text-rose-400 text-sm font-bold">{settings.numSpies}</span>
                  </div>
                  <input type="range" min={1} max={maxSpies} value={Math.min(settings.numSpies, maxSpies)}
                    onChange={e => actions.updateSettings({ numSpies: +e.target.value })} className="w-full" />
                </div>

                {/* Show Votes Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/90">Show Live Votes</label>
                    <p className="text-xs text-slate-500 dark:text-white/40 leading-snug max-w-[200px] mt-0.5">
                      Players can see who voted for whom during the voting phase.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showVotes}
                      onChange={(e) => actions.updateSettings({ showVotes: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Allow Whisper Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/90">Allow Whispers</label>
                    <p className="text-xs text-slate-500 dark:text-white/40 leading-snug max-w-[200px] mt-0.5">
                      Players can create custom private group chats.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowWhisper}
                      onChange={(e) => actions.updateSettings({ allowWhisper: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Auto-start Timer */}
                <div className="mb-6 flex items-center justify-between">
                  <label className="text-slate-500 dark:text-white/35 text-xs uppercase tracking-widest block">
                    {t('autoStartTimer', 'เริ่มเวลาอัตโนมัติเมื่อเข้าเกม')}
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoStartTimer ?? true}
                      onChange={(e) => actions.updateSettings({ autoStartTimer: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Timer */}
                <div className="mb-6">
                  <label className="text-slate-500 dark:text-white/35 text-xs uppercase tracking-widest mb-2 block">
                    {t('timerDuration')}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIMERS.map(m => (
                      <button
                        key={m}
                        onClick={() => actions.updateSettings({ timerMinutes: m })}
                        className={`py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          settings.timerMinutes === m
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-white/45 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {m}{t('minutes')}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  id="start-game-btn"
                  onClick={actions.startGame}
                  disabled={!canStart}
                  className="btn-primary w-full py-3.5 text-base"
                  whileHover={canStart ? { scale: 1.02 } : {}}
                  whileTap={canStart ? { scale: 0.98 } : {}}
                >
                  {canStart ? t('startBtn') : t('selectSet')}
                </motion.button>
              </div>
            ) : (
              /* ── Non-host info ─── */
              <div className="glass-card p-5 text-center">
                <motion.div className="text-4xl mb-3" animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>⏳</motion.div>
                <h3 className="text-slate-800 dark:text-white font-semibold mb-1">{t('waitingForHost')}</h3>
                <p className="text-slate-500 dark:text-white/35 text-sm mb-5">{t('hostWillConfigure')}</p>
                <div className="space-y-2 text-left">
                  {[
                    { label: t('timerLabel'), value: `${settings.timeLimit} ${t('minutes')}` },
                    { label: t('spiesLabel'), value: settings.numSpies },
                    { label: t('setsLabel'),  value: settings.locationSets.join(', ') || '—' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-100 dark:bg-white/5">
                      <span className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">{row.label}</span>
                      <span className="text-slate-800 dark:text-white text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button id="leave-room-btn" onClick={actions.leaveRoom} className="btn-ghost w-full text-sm">
              {t('leaveRoom')}
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── QR Code Modal ─── */}
      <AnimatePresence>
        {showQR && (
          <Modal title="Join via QR Code" onClose={() => setShowQR(false)}>
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl mb-4">
              <QRCodeSVG value={joinUrl} size={200} level="M" includeMargin={true} />
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-white/50 mb-4">
              Scan this code with a phone camera to join the room instantly!
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="btn-secondary w-full py-3"
            >
              Close
            </button>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Advanced Location Selection Modal ─── */}
      <AnimatePresence>
        {editingSet && (
          <LocationSelectionModal
            setId={editingSet.id}
            setName={editingSet.name}
            initialSelection={settings.customLocationsSelection?.[editingSet.id] || []}
            onClose={() => setEditingSet(null)}
            onSave={(selection) => {
              actions.updateSettings({
                customLocationsSelection: {
                  ...settings.customLocationsSelection,
                  [editingSet.id]: selection
                }
              });
              setEditingSet(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
