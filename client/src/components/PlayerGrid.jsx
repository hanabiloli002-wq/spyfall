import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-14 h-14', lg: 'w-20 h-20' };
  const fallback = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || 'player')}`;

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden ring-2 ring-violet-500/30 bg-violet-900/50 flex-shrink-0`}>
      <img
        src={src || fallback}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.src = fallback; }}
      />
    </div>
  );
}

export default function PlayerGrid({ showRoles = false, compact = false }) {
  const { state, actions } = useGame();
  const { players, hostId, socketId, isHost } = state;

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-white/30">
        <div className="text-3xl mb-2">👤</div>
        <p className="text-sm">No players yet</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
      {players.map((player, i) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
          layout
          className="glass-card p-3 flex flex-col items-center text-center relative group"
        >
          {/* Host crown */}
          {player.id === hostId && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base"
              title="Host"
            >
              👑
            </motion.span>
          )}

          {/* Kick Button (Host only) */}
          {isHost && player.id !== socketId && (
            <button
              onClick={() => {
                if (window.confirm(`Kick ${player.name}?`)) {
                  actions.kickPlayer(player.id);
                }
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 text-sm shadow-sm"
              title="Kick Player"
            >
              ✕
            </button>
          )}

          {/* Avatar */}
          <Avatar src={player.avatarUrl} name={player.name} size={compact ? 'sm' : 'md'} />

          {/* Name */}
          <p className={`text-slate-800 dark:text-white font-medium truncate w-full mt-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {player.name}
          </p>

          {/* Roles (post-game reveal) */}
          {showRoles && (
            <div className="mt-1.5">
              {player.isSpy ? (
                <span className="badge-rose text-xs px-2 py-0.5 rounded-full">
                  🕵️ Spy
                </span>
              ) : player.role ? (
                <span className="badge-violet text-xs px-2 py-0.5 rounded-full">
                  {player.role}
                </span>
              ) : null}
            </div>
          )}

          {/* Shimmer hover effect */}
          <div className="absolute inset-0 rounded-[1.25rem] shimmer-bg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
        </motion.div>
      ))}
    </div>
  );
}
