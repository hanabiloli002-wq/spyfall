import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

const gameManager = new GameManager();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: gameManager.getRoomCount() });
});

// Serve static frontend files (for production deployment)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Optional: you can put app.get('*', ...) at the very end of server.js if needed.

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ─── JOIN ROOM ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName, avatarUrl }) => {
    if (!roomId || !playerName) {
      socket.emit('join_error', { message: 'Room ID and name are required.' });
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
    const room = gameManager.getRoom(normalizedRoomId);

    // Reject if game already in progress
    if (room && room.state !== 'waiting') {
      socket.emit('join_error', { message: 'A game is already in progress in that room.' });
      return;
    }

    // Reject if room is full
    if (room && room.players.size >= room.settings.maxPlayers) {
      socket.emit('join_error', { message: 'Room is full.' });
      return;
    }

    const roomData = gameManager.joinRoom(normalizedRoomId, socket.id, playerName, avatarUrl);
    socket.join(normalizedRoomId);
    socket.data.roomId = normalizedRoomId;
    socket.data.playerName = playerName;

    // Send private room data to joining player
    socket.emit('room_joined', {
      roomId: normalizedRoomId,
      isHost: roomData.host === socket.id,
      settings: roomData.settings,
      state: roomData.state,
      scores: gameManager.getScores(normalizedRoomId),
    });

    // Broadcast updated player list to the whole room
    io.to(normalizedRoomId).emit('update_players', {
      players: gameManager.getPlayersArray(normalizedRoomId),
      host: roomData.host,
      scores: gameManager.getScores(normalizedRoomId),
    });

    // If game is in progress, catch this player up as a Spectator
    if (roomData.state !== 'waiting') {
      const room = gameManager.rooms.get(normalizedRoomId);
      socket.emit('game_started', {
        isSpy: false,
        role: 'Spectator',
        location: null,
        allLocations: room.currentLocation ? room.settings.locations : [], 
        players: gameManager.getPlayersArray(normalizedRoomId),
        firstPlayerId: room.firstPlayerId,
      });
      // also sync current time
      socket.emit('timer_sync', { timeLeft: room.timeLeft, timerRunning: room.timerRunning });
      
      // Sync chat channels
      const channels = gameManager.getChannels(roomId, socket.id);
      socket.emit('chat_channels_sync', channels);
    }

    console.log(`[Room ${normalizedRoomId}] ${playerName} joined (${roomData.players.size} players)`);
  });

  // ─── UPDATE SETTINGS ─────────────────────────────────────────────────────
  socket.on('update_settings', (settings) => {
    const roomId = socket.data.roomId;
    const room = gameManager.getRoom(roomId);
    if (!room || room.host !== socket.id) return;

    gameManager.updateSettings(roomId, settings);
    io.to(roomId).emit('update_settings', gameManager.getRoom(roomId).settings);
  });

  // ─── LOCATION SETS DATA ──────────────────────────────────────────────────
  socket.on('get_location_sets_data', () => {
    socket.emit('location_sets_data', gameManager.getLocationSetsData());
  });

  // ─── START GAME ──────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const roomId = socket.data.roomId;
    const room = gameManager.getRoom(roomId);
    if (!room || room.host !== socket.id || room.state !== 'waiting') return;

    if (room.players.size < 1) {
      socket.emit('join_error', { message: 'Need at least 1 player to start.' });
      return;
    }

    const gameData = gameManager.startGame(roomId);
    if (!gameData) {
      socket.emit('join_error', { message: 'No locations found for selected sets.' });
      return;
    }

    // Send private role info to each player
    room.players.forEach((player, socketId) => {
      io.to(socketId).emit('game_started', {
        isSpy: player.isSpy,
        role: player.role,
        location: player.isSpy || player.role === 'Spectator' ? null : gameData.location,
        allLocations: gameData.allLocations,
        players: gameManager.getPlayersArray(roomId),
        firstPlayerId: gameData.firstPlayerId,
        otherSpies: player.isSpy ? gameData.spies.filter(s => s.id !== socketId) : [],
        fullLocationData: player.role === 'Spectator' ? gameData.location : null,
        fullSpyData: player.role === 'Spectator' ? gameData.spies : null,
        fullPlayersRoles: player.role === 'Spectator' ? gameManager.getPlayersArray(roomId).map(p => ({ id: p.id, role: p.role, isSpy: p.isSpy })) : null
      });
    });

    console.log(`[Room ${roomId}] Game started — Location: "${gameData.location.name}"`);

    // Start server-side timer and broadcast every second
    const onTick = (timeLeft, timerRunning) => {
      io.to(roomId).emit('timer_sync', { timeLeft, timerRunning });

      if (timeLeft <= 0) {
        const currentRoom = gameManager.getRoom(roomId);
        if (currentRoom && currentRoom.state === 'playing') {
          gameManager.triggerVote(roomId);
          const votingTime = (currentRoom.settings.votingTimeLimit || 1) * 60;
          currentRoom.timeLeft = votingTime;
          io.to(roomId).emit('vote_started', {
            players: gameManager.getPlayersArray(roomId),
            reason: 'timeout',
            triggeredBy: null,
            votingTimeLimit: votingTime
          });
          console.log(`[Room ${roomId}] Timer expired — vote triggered`);
          
          const onVoteTick = (timeLeft, timerRunning) => {
            io.to(roomId).emit('vote_timer_sync', { timeLeft, timerRunning });
            if (timeLeft <= 0) {
              const r = gameManager.getRoom(roomId);
              if (r && r.state === 'voting') {
                r.state = 'ended';
                io.to(roomId).emit('game_ended', { ...gameManager._resolveVote(r), scores: gameManager.getScores(roomId) });
                console.log(`[Room ${roomId}] Voting timer expired — game ended`);
              }
            }
          };
          gameManager.startTimer(roomId, onVoteTick);
        }
      }
    };

    if (room.settings.autoStartTimer !== false) {
      gameManager.startTimer(roomId, onTick);
    } else {
      onTick(room.timeLeft, false);
    }
  });

  // ─── TOGGLE TIMER ────────────────────────────────────────────────────────
  socket.on('toggle_timer', () => {
    const roomId = socket.data.roomId;
    const room = gameManager.getRoom(roomId);
    if (!room || room.host !== socket.id || room.state !== 'playing') return;

    if (room.timerRunning) {
      gameManager.pauseTimer(roomId);
      io.to(roomId).emit('timer_sync', { timeLeft: room.timeLeft, timerRunning: false });
      console.log(`[Room ${roomId}] Timer paused by host`);
    } else {
      const onTick = (timeLeft, timerRunning) => {
        io.to(roomId).emit('timer_sync', { timeLeft, timerRunning });
        if (timeLeft <= 0) {
          const currentRoom = gameManager.getRoom(roomId);
          if (currentRoom && currentRoom.state === 'playing') {
            gameManager.triggerVote(roomId);
            const votingTime = (currentRoom.settings.votingTimeLimit || 1) * 60;
            currentRoom.timeLeft = votingTime;
            io.to(roomId).emit('vote_started', {
              players: gameManager.getPlayersArray(roomId),
              reason: 'timeout',
              triggeredBy: null,
              votingTimeLimit: votingTime
            });
            
            const onVoteTick = (t, running) => {
              io.to(roomId).emit('vote_timer_sync', { timeLeft: t, timerRunning: running });
              if (t <= 0) {
                const r = gameManager.getRoom(roomId);
                if (r && r.state === 'voting') {
                  r.state = 'ended';
                  io.to(roomId).emit('game_ended', { ...gameManager._resolveVote(r), scores: gameManager.getScores(roomId) });
                }
              }
            };
            gameManager.startTimer(roomId, onVoteTick);
          }
        }
      };
      gameManager.resumeTimer(roomId, onTick);
      console.log(`[Room ${roomId}] Timer resumed by host`);
    }
  });

  // ─── TRIGGER VOTE ────────────────────────────────────────────────────────
  socket.on('trigger_vote', () => {
    const roomId = socket.data.roomId;
    const room = gameManager.getRoom(roomId);
    if (!room || room.state !== 'playing') return;

    const req = gameManager.requestEmergencyVote(roomId, socket.id);
    if (!req) return;

    if (req.triggered) {
      gameManager.triggerVote(roomId);
      const votingTime = (room.settings.votingTimeLimit || 1) * 60;
      room.timeLeft = votingTime;
      
      io.to(roomId).emit('vote_started', {
        players: gameManager.getPlayersArray(roomId),
        reason: 'emergency',
        triggeredBy: socket.data.playerName,
        votingTimeLimit: votingTime
      });
      console.log(`[Room ${roomId}] Emergency vote triggered!`);

      const onVoteTick = (timeLeft, timerRunning) => {
        io.to(roomId).emit('vote_timer_sync', { timeLeft, timerRunning });
        if (timeLeft <= 0) {
          const r = gameManager.getRoom(roomId);
          if (r && r.state === 'voting') {
            r.state = 'ended';
            io.to(roomId).emit('game_ended', { ...gameManager._resolveVote(r), scores: gameManager.getScores(roomId) });
          }
        }
      };
      gameManager.startTimer(roomId, onVoteTick);
    } else {
      io.to(roomId).emit('emergency_vote_update', {
        count: req.count,
        required: req.required,
        voters: req.voters
      });
      console.log(`[Room ${roomId}] Emergency vote ${req.count}/${req.required} by ${socket.data.playerName}`);
    }
  });

  // ─── CAST VOTE ───────────────────────────────────────────────────────────
  socket.on('cast_vote', ({ targetId }) => {
    const roomId = socket.data.roomId;
    const result = gameManager.castVote(roomId, socket.id, targetId);
    if (result) {
      io.to(roomId).emit('vote_update', { votes: result.votes });
      if (result.resolved) {
        setTimeout(() => {
          io.to(roomId).emit('game_ended', { ...result.endData, scores: gameManager.getScores(roomId) });
          console.log(`[Room ${roomId}] Game ended via vote - spy found: ${result.endData.spyFound}`);
        }, 4000);
      }
    }
  });

  // ─── SPY GUESS ───────────────────────────────────────────────────────────
  socket.on('spy_guess', ({ locationGuess }) => {
    const roomId = socket.data.roomId;
    const result = gameManager.spyGuess(roomId, socket.id, locationGuess);
    if (!result) return;

    io.to(roomId).emit('game_ended', { ...result, scores: gameManager.getScores(roomId) });
    console.log(`[Room ${roomId}] Spy guessed "${locationGuess}" - correct: ${result.correct}`);
  });

  // ─── PLAY AGAIN ──────────────────────────────────────────────────────────
  socket.on('play_again', () => {
    const roomId = socket.data.roomId;
    const room = gameManager.getRoom(roomId);
    if (!room || room.host !== socket.id) return;

    gameManager.resetGame(roomId);
    io.to(roomId).emit('game_reset', {
      players: gameManager.getPlayersArray(roomId),
      settings: room.settings,
      host: room.host,
    });
    console.log(`[Room ${roomId}] Game reset by host`);
  });

  // ─── KICK PLAYER ────────────────────────────────────────────────────────
  socket.on('kick_player', ({ targetId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    
    const room = gameManager.getRoom(roomId);
    if (!room || room.host !== socket.id) return; // Only host can kick

    const result = gameManager.removePlayer(roomId, targetId);
    if (result) {
      // Notify the kicked player so they can leave gracefully
      io.to(targetId).emit('kicked', { message: 'You were kicked by the host.' });
      io.sockets.sockets.get(targetId)?.leave(roomId);
      
      io.to(roomId).emit('update_players', {
        players: result.players,
        host: result.host,
        scores: gameManager.getScores(roomId),
      });
      console.log(`[-] Player ${targetId} was kicked from ${roomId}`);
    }
  });

  // ─── UNIFIED CHAT ───────────────────────────────────────────────────────
  socket.on('send_chat_msg', ({ channelId, message }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    
    const room = gameManager.getRoom(roomId);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (!player) return;

    const ch = room.channels.get(channelId);
    if (!ch) return;

    // Verify access
    if (ch.members === 'spy' && !player.isSpy) return;
    if (Array.isArray(ch.members) && !ch.members.includes(socket.id)) return;
    // 'all' channel is accessible to all

    const msgData = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: socket.id,
      senderName: player.name,
      text: message,
      timestamp: Date.now(),
    };
    
    gameManager.addChannelMessage(roomId, channelId, msgData);
    
    // Broadcast to relevant members
    room.players.forEach((p, pSocketId) => {
      let canReceive = false;
      if (ch.members === 'all') canReceive = true;
      else if (ch.members === 'spy' && p.isSpy) canReceive = true;
      else if (Array.isArray(ch.members) && ch.members.includes(pSocketId)) canReceive = true;

      if (canReceive) {
        io.to(pSocketId).emit('chat_msg_received', { channelId, message: msgData });
      }
    });
  });

  socket.on('create_whisper', ({ memberIds }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    
    const result = gameManager.createWhisperGroup(roomId, socket.id, memberIds);
    if (!result) return;

    // Send the new channel to all its members
    result.channel.members.forEach(mId => {
      io.to(mId).emit('whisper_created', {
        id: result.id,
        name: result.channel.name,
        type: result.channel.type,
        messages: result.channel.messages,
        memberIds: result.channel.members,
      });
    });
  });

  // ─── DISCONNECT ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const result = gameManager.removePlayer(roomId, socket.id);
    if (result) {
      io.to(roomId).emit('update_players', {
        players: result.players,
        host: result.host,
        scores: gameManager.getScores(roomId),
      });
      console.log(`[-] Disconnected: ${socket.data.playerName} from ${roomId}`);
    }
  });

  // ─── LEAVE ROOM ──────────────────────────────────────────────────────────
  socket.on('leave_room', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const result = gameManager.removePlayer(roomId, socket.id);
    socket.leave(roomId);
    socket.data.roomId = null;

    if (result) {
      io.to(roomId).emit('update_players', {
        players: result.players,
        host: result.host,
        scores: gameManager.getScores(roomId),
      });
    }
  });
});

// Catch-all route to serve the React index.html for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
