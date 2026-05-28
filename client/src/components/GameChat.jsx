import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Modal from './ui/Modal';

export default function GameChat() {
  const { state, actions } = useGame();
  const { channels, spyNote, isSpy, players, settings, socketId, toastMessage } = state;
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'spy', 'note', or 'whisper_<id>'
  const [text, setText] = useState('');
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const endRef = useRef(null);

  // Fallback to 'all' if tab removed
  useEffect(() => {
    if (activeTab !== 'note' && !channels.find(c => c.id === activeTab)) {
      setActiveTab('all');
    }
  }, [channels, activeTab]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Clear unread for active tab
      setUnreadCounts(prev => ({ ...prev, [activeTab]: 0 }));
    }
  }, [channels, activeTab, isOpen]);

  // Handle new incoming messages (Toast & Unread)
  useEffect(() => {
    if (toastMessage && toastMessage.message.senderId !== socketId) {
      // It's a new message from someone else!
      const channelId = toastMessage.channelId;
      const ch = channels.find(c => c.id === channelId);
      const channelName = ch?.name || 'Chat';
      
      // If chat is closed OR user is on a different tab, show a popup and increment unread
      if (!isOpen || activeTab !== channelId) {
        setUnreadCounts(prev => ({ ...prev, [channelId]: (prev[channelId] || 0) + 1 }));
        
        const newToast = {
          id: toastMessage.id,
          senderName: toastMessage.message.senderName,
          text: toastMessage.message.text,
          channelName,
          channelId
        };
        
        setToasts(prev => [...prev, newToast]);
        
        // Auto remove toast after 4s
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 4000);
      }
    }
  }, [toastMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'note') return; // Notes auto-save via onChange
    if (!text.trim()) return;
    actions.sendChatMessage(activeTab, text.trim());
    setText('');
  };

  const handleCreateWhisper = () => {
    if (selectedMembers.length === 0) return;
    actions.createWhisper(selectedMembers);
    setShowWhisperModal(false);
    setSelectedMembers([]);
  };

  const activeChannel = channels.find(c => c.id === activeTab);
  const messages = activeChannel?.messages || [];
  
  // Decide Theme based on tab
  let theme = 'violet';
  if (activeTab === 'spy' || activeTab === 'note') theme = 'rose';
  else if (activeTab.startsWith('whisper_')) theme = 'emerald';
  
  const themeClasses = {
    violet: {
      bg: 'bg-violet-500/5',
      border: 'border-violet-500/20',
      header: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      myMsg: 'bg-violet-600 text-white',
      theirMsg: 'bg-violet-500/10 text-violet-800 dark:text-violet-200 border-violet-500/20',
      input: 'border-violet-500/30 focus:border-violet-500',
      btn: 'bg-violet-600 text-white',
    },
    rose: {
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      header: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      myMsg: 'bg-rose-600 text-white',
      theirMsg: 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/20',
      input: 'border-rose-500/30 focus:border-rose-500',
      btn: 'bg-rose-600 text-white',
    },
    emerald: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      header: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      myMsg: 'bg-emerald-600 text-white',
      theirMsg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20',
      input: 'border-emerald-500/30 focus:border-emerald-500',
      btn: 'bg-emerald-600 text-white',
    }
  };

  const tc = themeClasses[theme];
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end">
      
      {/* ─── TOAST NOTIFICATIONS ─── */}
      <div className="flex flex-col items-end gap-2 mb-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-white/10 rounded-xl p-3 max-w-[300px] pointer-events-auto cursor-pointer"
              onClick={() => {
                setIsOpen(true);
                setActiveTab(toast.channelId);
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{toast.channelName}</span>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{toast.senderName}</p>
              <p className="text-xs text-slate-500 dark:text-white/60 truncate">{toast.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Widget Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`glass-card flex flex-col w-[350px] sm:w-[400px] h-[500px] max-h-[75vh] mb-4 overflow-hidden border shadow-2xl ${tc.border}`}
          >
            {/* Tabs */}
            <div className={`flex overflow-x-auto no-scrollbar border-b ${tc.border} ${tc.header} px-2 pt-2 items-end gap-1`}>
              {channels.map(ch => {
                const unread = unreadCounts[ch.id] || 0;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab(ch.id)}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-bold whitespace-nowrap transition-colors relative ${
                      activeTab === ch.id ? 'bg-white dark:bg-slate-800 shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {ch.type === 'all' && '🌐 All'}
                    {ch.type === 'spy' && '🕵️ Spy'}
                    {ch.type === 'whisper' && `🔒 ${ch.name}`}
                    {unread > 0 && activeTab !== ch.id && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px]">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {isSpy && (
                <button
                  onClick={() => setActiveTab('note')}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeTab === 'note' ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-500' : 'opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 text-rose-500'
                  }`}
                >
                  📝 Note
                </button>
              )}

              {settings.allowWhisper && (
                <button
                  onClick={() => setShowWhisperModal(true)}
                  className="px-2 py-1.5 opacity-60 hover:opacity-100 ml-auto"
                  title="Create Whisper"
                >
                  ➕
                </button>
              )}
            </div>

            {/* Content */}
            {activeTab === 'note' ? (
              <div className={`flex-1 p-3 ${tc.bg}`}>
                <textarea
                  value={spyNote}
                  onChange={(e) => actions.setSpyNote(e.target.value)}
                  placeholder="Write down suspicious behaviors or plans here... This is private to you."
                  className="w-full h-full bg-white/50 dark:bg-black/20 border-none rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-white resize-none"
                />
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${tc.bg}`}>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <span className="text-4xl mb-2">💬</span>
                      <p className="text-center text-xs">No messages yet in {activeChannel?.name}...</p>
                      <p className="text-center text-[10px] mt-1">Say hi to everyone!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.senderId === socketId;
                      const sender = players.find(p => p.id === msg.senderId);
                      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && sender && (
                            <img src={sender.avatarUrl} alt={sender.name} className="w-8 h-8 rounded-full shadow-sm mt-1 flex-shrink-0" />
                          )}
                          
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            {!isMe && (
                              <span className="text-[10px] opacity-70 mb-0.5 ml-1 font-bold">
                                {msg.senderName}
                              </span>
                            )}
                            
                            <div className="flex items-end gap-1.5">
                              {isMe && <span className="text-[9px] opacity-50 mb-0.5">{timeStr}</span>}
                              <div
                                className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                                  isMe ? `${tc.myMsg} rounded-br-sm` : `${tc.theirMsg} bg-white dark:bg-slate-800 border rounded-bl-sm`
                                }`}
                              >
                                {msg.text}
                              </div>
                              {!isMe && <span className="text-[9px] opacity-50 mb-0.5">{timeStr}</span>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className={`p-3 border-t ${tc.border} flex gap-2`}>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${activeChannel?.name}...`}
                    className={`flex-1 bg-white/50 dark:bg-black/20 border rounded-lg px-3 py-2 text-sm focus:outline-none text-slate-800 dark:text-white ${tc.input}`}
                    maxLength={150}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-50 transition-opacity shadow-md ${tc.btn}`}
                  >
                    ➤
                  </button>
                </form>
              </>
            )}

            {/* Whisper Modal */}
            <AnimatePresence>
              {showWhisperModal && (
                <Modal title="Create Whisper Group" onClose={() => setShowWhisperModal(false)}>
                  <p className="text-slate-500 dark:text-white/45 text-sm mb-4">Select players to whisper to secretly:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {players.filter(p => p.id !== socketId && p.role !== 'Spectator').map(p => {
                      const selected = selectedMembers.includes(p.id);
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => {
                            if (selected) setSelectedMembers(prev => prev.filter(id => id !== p.id));
                            else setSelectedMembers(prev => [...prev, p.id]);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors border ${
                            selected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                            {selected && '✓'}
                          </div>
                          <img src={p.avatarUrl} alt={p.name} className="w-6 h-6 rounded-full" />
                          <span className="font-semibold text-sm">{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWhisperModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-slate-500 dark:text-white/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateWhisper}
                      disabled={selectedMembers.length === 0}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </Modal>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 relative ${
          isOpen ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
        }`}
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0a0f1e]">
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
