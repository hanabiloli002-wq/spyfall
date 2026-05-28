import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function SpyChat() {
  const { state, actions } = useGame();
  const { spyMessages } = state;
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [spyMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    actions.sendSpyMessage(text.trim());
    setText('');
  };

  return (
    <div className="glass-card flex flex-col h-[300px] border-rose-500/30 mt-4 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between">
        <h3 className="font-bold text-rose-500 flex items-center gap-2">
          <span>🕵️</span> Spy Network
        </h3>
        <span className="badge-rose text-[10px] uppercase tracking-wider px-2 py-0.5">Top Secret</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-rose-500/5">
        {spyMessages.length === 0 ? (
          <p className="text-center text-rose-500/50 text-xs mt-4">
            Coordinate with your fellow spies here...
          </p>
        ) : (
          spyMessages.map((msg, index) => {
            const isMe = msg.senderId === state.socketId;
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] text-rose-400/80 mb-0.5 ml-1 font-bold">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-xl max-w-[85%] text-sm shadow-sm ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-sm'
                      : 'bg-rose-500/20 text-rose-800 dark:text-rose-100 rounded-bl-sm border border-rose-500/20'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-rose-500/10 border-t border-rose-500/20 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Whisper to spies..."
          className="flex-1 bg-white/50 dark:bg-black/20 border border-rose-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-white placeholder-rose-500/40"
          maxLength={150}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center disabled:opacity-50 transition-opacity shadow-md"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
