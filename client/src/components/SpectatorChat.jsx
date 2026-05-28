import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function SpectatorChat() {
  const { state, actions } = useGame();
  const { spectatorMessages } = state;
  const [text, setText] = useState('');
  const endRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [spectatorMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    actions.sendSpectatorMessage(text.trim());
    setText('');
  };

  return (
    <div className="glass-card flex flex-col h-[400px] border-violet-500/20 mt-4 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <span>💬</span> Spectator Chat
        </h3>
        <span className="badge-violet text-xs">Hidden from players</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/30 dark:bg-black/10">
        {spectatorMessages.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-white/30 text-xs mt-4">
            No messages yet. Chat with other spectators!
          </p>
        ) : (
          spectatorMessages.map((msg, index) => {
            const isMe = msg.senderId === state.socketId;
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] text-slate-400 dark:text-white/40 mb-0.5 ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                    isMe
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-bl-sm'
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
      <form onSubmit={handleSubmit} className="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
          maxLength={150}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
