import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export default function RoleCard() {
  const { state } = useGame();
  const { t }     = useLanguage();
  const { isSpy, myRole, currentLocation, otherSpies } = state;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
    const timer = setTimeout(() => setFlipped(true), 1800);
    return () => clearTimeout(timer);
  }, [isSpy, myRole]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="perspective w-full">
        <motion.div
          className="relative w-full"
          style={{ height: '240px', transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => setFlipped(f => !f)}
        >
          {/* ── Front: mystery ─── */}
          <div
            className="absolute inset-0 bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl shadow-violet-500/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 via-transparent to-cyan-400/20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 0.95, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center mb-4 relative z-10 shadow-inner"
            >
              <span className="text-4xl">?</span>
            </motion.div>
            
            <div className="text-center relative z-10 px-6 w-full">
              <div className="h-2 w-16 bg-slate-700 mx-auto rounded-full mb-3" />
              <div className="h-2 w-32 bg-slate-700 mx-auto rounded-full mb-1.5" />
              <div className="h-2 w-24 bg-slate-700 mx-auto rounded-full" />
            </div>
            
            <p className="absolute bottom-4 text-[10px] tracking-widest text-slate-500 uppercase font-bold">Classified Dossier</p>
          </div>

          {/* ── Back: role reveal ─── */}
          <div
            className={`absolute inset-0 rounded-2xl flex flex-col overflow-hidden shadow-2xl ${
              isSpy ? 'bg-rose-950 border border-rose-500/40 shadow-rose-500/20' : 'bg-slate-900 border border-emerald-500/40 shadow-emerald-500/20'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* ID Card Header */}
            <div className={`h-12 w-full flex items-center px-4 border-b ${isSpy ? 'bg-rose-900/50 border-rose-500/30' : 'bg-slate-800 border-emerald-500/30'}`}>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${isSpy ? 'text-rose-300' : 'text-emerald-400'}`}>
                {isSpy ? 'Threat Level: Critical' : 'Clearance: Level 5'}
              </div>
              <div className="ml-auto w-12 h-4 rounded border opacity-50 flex items-center justify-between px-1">
                <div className="w-1 h-2 bg-current" /><div className="w-1 h-2 bg-current" /><div className="w-1 h-2 bg-current" />
              </div>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center relative">
              {/* Hologram pattern */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 mix-blend-overlay" />
              
              {isSpy ? (
                <>
                  <div className="flex items-start gap-4 relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: flipped ? 1 : 0 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="w-16 h-16 rounded-lg bg-rose-900/80 border border-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/20 text-3xl"
                    >🕵️</motion.div>
                    <div>
                      <p className="text-[10px] text-rose-400/70 uppercase tracking-widest mb-0.5">Identity</p>
                      <motion.h3
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: flipped ? 1 : 0, x: flipped ? 0 : -10 }}
                        transition={{ delay: 0.5 }}
                        className="text-rose-100 text-xl font-black mb-1 leading-tight"
                      >{t('youAreTheSpy')}</motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: flipped ? 1 : 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-rose-400/80 text-xs leading-snug"
                      >{t('blendInTip')}</motion.p>
                    </div>
                  </div>

                  {otherSpies && otherSpies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 10 }}
                      transition={{ delay: 0.8 }}
                      className="mt-4 p-2.5 bg-rose-950 rounded border border-rose-500/30 relative z-10"
                    >
                      <p className="text-[9px] uppercase tracking-widest text-rose-500 mb-1 font-bold">Network Contacts</p>
                      <p className="text-sm font-semibold text-rose-200">
                        {otherSpies.map(s => s.name).join(', ')}
                      </p>
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4 relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: flipped ? 1 : 0 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-16 h-16 rounded-lg bg-emerald-900/40 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10 text-3xl"
                    >📍</motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-0.5">{t('locationLabel')}</p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: flipped ? 1 : 0, x: flipped ? 0 : -10 }}
                        transition={{ delay: 0.4 }}
                        className="text-white text-lg font-bold leading-tight break-words mb-2"
                      >{currentLocation?.name}</motion.p>
                      
                      <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-0.5">{t('yourRole')}</p>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: flipped ? 1 : 0, x: flipped ? 0 : -10 }}
                        transition={{ delay: 0.55 }}
                        className="text-emerald-100 font-semibold text-sm"
                      >{myRole}</motion.p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* ID Card Footer */}
            <div className={`h-6 w-full flex items-center justify-between px-4 text-[8px] tracking-widest uppercase font-bold opacity-60 ${isSpy ? 'bg-rose-950 text-rose-400' : 'bg-slate-900 text-emerald-400'}`}>
              <span>ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
              <span>AUTH: VALID</span>
            </div>
          </div>
        </motion.div>
      </div>
      <p className="text-center text-slate-400 dark:text-white/20 text-xs mt-2">
        {flipped ? t('tapToHide') : t('tapToReveal')}
      </p>
    </div>
  );
}
