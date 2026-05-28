import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useGame } from './context/GameContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { useSocket } from './hooks/useSocket';
import LobbyPage   from './pages/LobbyPage';
import WaitingRoom  from './pages/WaitingRoom';
import GamePage     from './pages/GamePage';
import VotingPage   from './pages/VotingPage';
import ResultsPage  from './pages/ResultsPage';

// ─── Inner app (needs both contexts) ─────────────────────────────────────
function AppContent() {
  const { state }        = useGame();
  const { lang, t, toggleLang } = useLanguage();
  const [darkMode, setDarkMode] = useState(true);
  useSocket();

  const toggleDark = () => {
    setDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
  };

  const pageMap = {
    lobby:   <LobbyPage />,
    waiting: <WaitingRoom />,
    playing: <GamePage />,
    voting:  <VotingPage />,
    ended:   <ResultsPage />,
  };

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 ${
        darkMode
          ? 'bg-gradient-to-br from-[#0a0f1e] via-[#0d1526] to-[#0a1020]'
          : 'bg-gradient-to-br from-violet-50 via-slate-100 to-indigo-100'
      }`}
    >
      {/* Ambient orbs — dimmer in light mode */}
      <div className={`orb orb-violet ${darkMode ? '' : 'opacity-[0.06]'}`} />
      <div className={`orb orb-blue   ${darkMode ? '' : 'opacity-[0.04]'}`} />
      <div className={`orb orb-emerald ${darkMode ? '' : 'opacity-[0.03]'}`} />

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />

      {/* ── Fixed top-right controls ─── */}
      {/* Dark/Light toggle */}
      <button
        id="dark-mode-toggle"
        onClick={toggleDark}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full glass-card flex items-center justify-center text-lg hover:scale-110 transition-transform"
        aria-label="Toggle dark mode"
      >
        {darkMode ? '🌙' : '☀️'}
      </button>

      {/* Language toggle */}
      <button
        id="lang-toggle"
        onClick={toggleLang}
        className="fixed top-4 right-16 z-50 h-10 px-3 rounded-full glass-card flex items-center gap-1.5 text-xs font-bold hover:scale-110 transition-transform text-slate-600 dark:text-white/70"
        aria-label="Toggle language"
      >
        {lang === 'en' ? '🇹🇭' : '🇬🇧'}
        <span>{lang === 'en' ? 'TH' : 'EN'}</span>
      </button>

      {/* Connection dot */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full transition-colors duration-500 ${
            state.connected
              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
              : 'bg-rose-500'
          }`}
        />
        <span className="text-slate-400 dark:text-white/25 text-xs hidden sm:block">
          {state.connected ? t('connected') : t('disconnected')}
        </span>
      </div>

      {/* Page transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.phase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10"
        >
          {pageMap[state.phase] ?? <LobbyPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <LanguageProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </LanguageProvider>
  );
}
