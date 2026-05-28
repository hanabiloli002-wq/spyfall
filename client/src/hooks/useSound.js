import { useCallback, useRef } from 'react';

export function useSound() {
  const ctxRef = useRef(null);

  const initCtx = () => {
    if (!ctxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) ctxRef.current = new AudioContext();
    }
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const playTone = useCallback((freq, type, duration, vol = 0.1) => {
    const ctx = initCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playJoin = useCallback(() => {
    playTone(440, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(660, 'sine', 0.15, 0.05), 100);
  }, [playTone]);

  const playStart = useCallback(() => {
    playTone(330, 'square', 0.1, 0.05);
    setTimeout(() => playTone(440, 'square', 0.1, 0.05), 100);
    setTimeout(() => playTone(880, 'square', 0.3, 0.05), 200);
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone(800, 'sine', 0.05, 0.02);
  }, [playTone]);

  const playReveal = useCallback(() => {
    // A low rising suspense tone
    const ctx = initCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 2.0);
    
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  }, []);

  const playWin = useCallback(() => {
    playTone(523.25, 'sine', 0.2, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 150); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 300); // G5
  }, [playTone]);

  const playLose = useCallback(() => {
    playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => playTone(250, 'sawtooth', 0.5, 0.1), 300);
  }, [playTone]);

  return { playJoin, playStart, playTick, playReveal, playWin, playLose };
}
