import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load location data ────────────────────────────────────────────────────
function loadSet(filename) {
  const raw = readFileSync(join(__dirname, 'data', filename), 'utf-8');
  return JSON.parse(raw);
}

const LOCATION_SETS = {
  standard1: loadSet('standard1.json'),
  standard2: loadSet('standard2.json'),
  standard3: loadSet('standard3.json'),
  fantasy: loadSet('fantasy.json'),
  scifi: loadSet('scifi.json'),
};

// ─── GameManager ──────────────────────────────────────────────────────────
export class GameManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  getPublicRooms() {
    const publicRooms = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.state === 'waiting' && !room.isPrivate) {
        publicRooms.push({
          id: roomId,
          name: room.name,
          hostName: room.players.get(room.host)?.name || 'Unknown',
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
        });
      }
    }
    return publicRooms;
  }

  // ── Join / Create ───────────────────────────────────────────────────────
  joinRoom(roomId, socketId, playerName, avatarUrl, roomName = null, isPrivate = false) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        host: socketId,
        players: new Map(),
        settings: {
          locationSets: ['standard1'],
          customLocationsSelection: {}, // { setId: [locationName1, locationName2, ...] }
          customLocations: [],
          maxPlayers: 8,
          numSpies: 1,
          timerMinutes: 8,
          autoStartTimer: true,
        },
        state: 'waiting',      // 'waiting' | 'playing' | 'voting' | 'ended'
        currentLocation: null,
        timer: null,
        timerRunning: false,
        timeLeft: 0,
        votes: new Map(),      // targetId -> [voterId, ...]
        votedPlayers: new Set(),
        scores: new Map(),     // playerName -> { spyWins: 0, detectiveWins: 0 }
        firstPlayerId: null,
        channels: new Map([
          ['all', { name: 'All', type: 'all', members: 'all', messages: [] }],
          ['spy', { name: 'Spy Network', type: 'spy', members: 'spy', messages: [] }]
        ]),
        name: roomName || `Room ${roomId}`,
        isPrivate: isPrivate || false,
      });
    }

    const room = this.rooms.get(roomId);
    
    // Initialize score for new player
    if (!room.scores.has(playerName)) {
      room.scores.set(playerName, { spyWins: 0, detectiveWins: 0 });
    }

    // Determine if joining as spectator
    const isSpectator = room.state !== 'waiting';

    room.players.set(socketId, {
      id: socketId,
      name: playerName,
      avatarUrl,
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'), // Random hex color
      role: isSpectator ? 'Spectator' : null,
      isSpy: false,
    });

    return room;
  }

  updatePlayerColor(roomId, socketId, color) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const player = room.players.get(socketId);
    if (player) {
      player.color = color;
      return true;
    }
    return false;
  }

  // ── Remove Player ────────────────────────────────────────────────────────
  removePlayer(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players.delete(socketId);

    if (room.players.size === 0) {
      if (room.timer) clearInterval(room.timer);
      this.rooms.delete(roomId);
      return null;
    }

    // Re-assign host if the host left
    if (room.host === socketId) {
      room.host = room.players.keys().next().value;
    }

    return {
      players: this.getPlayersArray(roomId),
      host: room.host,
    };
  }

  // ── Players Array ────────────────────────────────────────────────────────
  getPlayersArray(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.players.values());
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  updateSettings(roomId, settings) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Validate locationSets
    const validSets = Object.keys(LOCATION_SETS);
    if (settings.locationSets) {
      settings.locationSets = settings.locationSets.filter(s => validSets.includes(s) || s === 'custom');
      if (settings.locationSets.length === 0) return; // ignore if empty
    }

    room.settings = { ...room.settings, ...settings };
  }

  // ── Start Game ───────────────────────────────────────────────────────────
  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Gather all locations from selected sets
    const allLocations = [];
    room.settings.locationSets.forEach(setId => {
      if (setId === 'custom' && room.settings.customLocations && room.settings.customLocations.length > 0) {
        room.settings.customLocations.forEach(line => {
          if (!line.trim()) return;
          const [name, ...rolesParts] = line.split(':');
          let roles = ['Player', 'Visitor', 'Employee', 'Local', 'Stranger']; // Generic defaults
          if (rolesParts.length > 0) {
            const rolesStr = rolesParts.join(':').trim();
            if (rolesStr) {
              roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean);
            }
          }
          if (roles.length === 0) roles = ['Player'];
          allLocations.push({ name: name.trim(), roles });
        });
      } else if (LOCATION_SETS[setId]) {
        const fullSet = LOCATION_SETS[setId].locations;
        const customSelection = room.settings.customLocationsSelection?.[setId];
        
        if (Array.isArray(customSelection) && customSelection.length > 0) {
          const selectedLocs = fullSet.filter(loc => customSelection.includes(loc.name));
          allLocations.push(...selectedLocs);
        } else {
          // Default: 20 random locations
          const shuffled = [...fullSet].sort(() => 0.5 - Math.random());
          const toAdd = shuffled.slice(0, 20);
          allLocations.push(...toAdd);
        }
      }
    });

    if (allLocations.length === 0) return null;

    // Pick random location
    const location = allLocations[Math.floor(Math.random() * allLocations.length)];
    room.currentLocation = location;
    room.state = 'playing';
    room.timeLeft = room.settings.timerMinutes * 60;
    room.timerRunning = !!room.settings.autoStartTimer;
    room.votes = new Map();
    room.votedPlayers = new Set();
    room.emergencyVotes = new Set();
    room.gameStartTime = Date.now();
    room.votingHistory = [];

    // Assign spies and roles (only to non-spectators)
    const playerIds = Array.from(room.players.keys()).filter(id => room.players.get(id).role !== 'Spectator');
    if (playerIds.length === 0) return null;

    const numSpies = Math.min(room.settings.numSpies, Math.max(1, playerIds.length - 1));

    // Shuffle a copy of player IDs
    const shuffledIds = [...playerIds].sort(() => Math.random() - 0.5);
    const spySet = new Set(shuffledIds.slice(0, numSpies));
    
    room.firstPlayerId = shuffledIds[Math.floor(Math.random() * shuffledIds.length)];

    // Shuffle location roles
    const shuffledRoles = [...location.roles].sort(() => Math.random() - 0.5);
    let roleIdx = 0;

    playerIds.forEach(id => {
      const player = room.players.get(id);
      if (spySet.has(id)) {
        player.isSpy = true;
        player.role = 'Spy';
      } else {
        player.isSpy = false;
        player.role = shuffledRoles[roleIdx % shuffledRoles.length];
        roleIdx++;
      }
    });

    return {
      location,
      allLocations: allLocations.map(l => l.name),
      firstPlayerId: room.firstPlayerId,
      spies: Array.from(spySet).map(id => {
        const p = room.players.get(id);
        return { id, name: p.name };
      }),
    };
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  startTimer(roomId, onTick) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.timer) clearInterval(room.timer);
    room.timerRunning = true;

    // Emit immediately so clients see the initial value
    onTick(room.timeLeft, room.timerRunning);

    room.timer = setInterval(() => {
      const r = this.rooms.get(roomId);
      if (!r || r.state !== 'playing' || !r.timerRunning) {
        clearInterval(r?.timer);
        return;
      }
      r.timeLeft = Math.max(0, r.timeLeft - 1);
      onTick(r.timeLeft, r.timerRunning);
    }, 1000);
  }

  pauseTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    
    room.timerRunning = false;
    if (room.timer) clearInterval(room.timer);
    return room.timeLeft;
  }

  resumeTimer(roomId, onTick) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') return;

    if (!room.timerRunning) {
      this.startTimer(roomId, onTick);
    }
  }

  // ── Trigger Vote ─────────────────────────────────────────────────────────
  triggerVote(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }

    room.state = 'voting';
    room.votes = new Map();
    room.votedPlayers = new Set();
    if (room.emergencyVotes) room.emergencyVotes.clear();

    // Initialize vote entries for all players
    room.players.forEach((_, id) => room.votes.set(id, []));
  }

  // ── Request Emergency Vote ────────────────────────────────────────────────
  requestEmergencyVote(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') return null;

    if (!room.emergencyVotes) room.emergencyVotes = new Set();
    
    if (room.emergencyVotes.has(playerId)) {
      room.emergencyVotes.delete(playerId);
    } else {
      room.emergencyVotes.add(playerId);
    }

    const activePlayersCount = Array.from(room.players.values()).filter(p => p.role !== 'Spectator').length;
    const required = Math.floor(activePlayersCount / 2) + 1; // More than half

    return {
      count: room.emergencyVotes.size,
      required,
      triggered: room.emergencyVotes.size >= required,
      voters: Array.from(room.emergencyVotes)
    };
  }

  // ── Cast Vote ────────────────────────────────────────────────────────────
  castVote(roomId, voterId, targetId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'voting') return null;

    // Remove any previous vote from this voter
    room.votes.forEach((voters, tid) => {
      const idx = voters.indexOf(voterId);
      if (idx !== -1) {
        voters.splice(idx, 1);
      }
    });

    if (targetId === null) {
      room.votedPlayers.delete(voterId);
    } else if (room.players.has(targetId)) {
      room.votes.get(targetId).push(voterId);
      room.votedPlayers.add(voterId);
    } else {
      return null;
    }

    const votes = this._buildVotesArray(room);
    
    // Removed early resolution so players can change their minds until timer ends
    const resolved = false;

    if (resolved) {
      room.state = 'ended';
      return {
        votes,
        resolved: true,
        endData: this._resolveVote(room),
      };
    }

    return { votes, resolved: false };
  }

  _resolveVote(room) {
    let maxVotes = -1;
    let accusedId = null;

    room.votes.forEach((voters, targetId) => {
      if (voters.length > maxVotes) {
        maxVotes = voters.length;
        accusedId = targetId;
      }
    });

    const accused = accusedId ? room.players.get(accusedId) : null;
    const spies = Array.from(room.players.values()).filter(p => p.isSpy);
    const spyFound = !!(accused && accused.isSpy);

    // Update Scores
    if (spyFound) {
      room.players.forEach(p => {
        if (!p.isSpy && p.role !== 'Spectator' && room.scores.has(p.name)) {
          room.scores.get(p.name).detectiveWins++;
        }
      });
    } else {
      spies.forEach(spy => {
        if (room.scores.has(spy.name)) {
          room.scores.get(spy.name).spyWins++;
        }
      });
    }

    const durationMs = Date.now() - (room.gameStartTime || Date.now());
    const durationStr = Math.floor(durationMs / 60000) + 'm ' + Math.floor((durationMs % 60000) / 1000) + 's';
    
    // Achievements
    const achievements = [];
    if (!spyFound && accused && !accused.isSpy) achievements.push({ title: 'แพะรับบาป (Scapegoat)', name: accused.name });
    if (!spyFound) spies.forEach(spy => achievements.push({ title: 'จอมเนียน (Master Spy)', name: spy.name }));
    
    // Find who started emergency vote (we don't have it tracked here easily, but we can just use basic ones)

    return {
      type: 'vote',
      spyFound,
      accusedPlayer: accused
        ? { id: accused.id, name: accused.name, avatarUrl: accused.avatarUrl, isSpy: accused.isSpy }
        : null,
      spyPlayer: spies[0] // fallback for old code
        ? { id: spies[0].id, name: spies[0].name, avatarUrl: spies[0].avatarUrl }
        : null,
      spies: spies.map(spy => ({ id: spy.id, name: spy.name, avatarUrl: spy.avatarUrl })),
      location: room.currentLocation,
      votes: this._buildVotesArray(room),
      allPlayers: Array.from(room.players.values()),
      durationStr,
      achievements
    };
  }

  _buildVotesArray(room) {
    return Array.from(room.votes.entries()).map(([targetId, voters]) => ({
      targetId,
      targetName: room.players.get(targetId)?.name || '?',
      voteCount: voters.length,
      voters: voters.map(id => {
        const p = room.players.get(id);
        return p ? { id: p.id, name: p.name, avatarUrl: p.avatarUrl } : { id, name: '?', avatarUrl: '' };
      }),
    }));
  }

  // ── Spy Guess ────────────────────────────────────────────────────────────
  spyGuess(roomId, socketId, locationGuess) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (!player || !player.isSpy) return null;

    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    room.state = 'ended';

    const correct =
      room.currentLocation.name.toLowerCase().trim() ===
      locationGuess.toLowerCase().trim();

    // Update Scores
    if (correct) {
      const spies = Array.from(room.players.values()).filter(p => p.isSpy);
      spies.forEach(spy => {
        if (room.scores.has(spy.name)) {
          room.scores.get(spy.name).spyWins++;
        }
      });
    } else {
      room.players.forEach(p => {
        if (!p.isSpy && p.role !== 'Spectator' && room.scores.has(p.name)) {
          room.scores.get(p.name).detectiveWins++;
        }
      });
    }

    const durationMs = Date.now() - (room.gameStartTime || Date.now());
    const durationStr = Math.floor(durationMs / 60000) + 'm ' + Math.floor((durationMs % 60000) / 1000) + 's';
    
    const achievements = [];
    if (correct) {
      achievements.push({ title: 'สปายอัจฉริยะ (Genius Spy)', name: player.name });
    } else {
      achievements.push({ title: 'สปายโป๊ะแตก (Clumsy Spy)', name: player.name });
    }

    return {
      type: 'spy_guess',
      correct,
      spyPlayer: { id: player.id, name: player.name, avatarUrl: player.avatarUrl },
      spies: Array.from(room.players.values()).filter(p => p.isSpy).map(spy => ({ id: spy.id, name: spy.name, avatarUrl: spy.avatarUrl })),
      location: room.currentLocation,
      guessedLocation: locationGuess,
      allPlayers: Array.from(room.players.values()),
      durationStr,
      achievements,
      votes: [] // Empty votes for consistency in UI
    };
  }

  // ── Reset Game ───────────────────────────────────────────────────────────
  resetGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }

    room.state = 'waiting';
    room.currentLocation = null;
    room.timeLeft = 0;
    room.timerRunning = false;
    room.votes = new Map();
    room.votedPlayers = new Set();
    room.emergencyVotes = new Set();

    room.players.forEach(player => {
      player.role = null;
      player.isSpy = false;
    });
    room.firstPlayerId = null;
  }
  
  getScores(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Object.fromEntries(room.scores) : {};
  }
  
  // ── Unified Chat ────────────────────────────────────────────────────────
  getChannels(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    const player = room.players.get(playerId);
    const result = [];
    room.channels.forEach((ch, id) => {
      if (ch.members === 'all') result.push({ id, name: ch.name, type: ch.type, messages: ch.messages });
      else if (ch.members === 'spy' && player?.isSpy) result.push({ id, name: ch.name, type: ch.type, messages: ch.messages });
      else if (Array.isArray(ch.members) && ch.members.includes(playerId)) {
        result.push({ id, name: ch.name, type: ch.type, messages: ch.messages, memberIds: ch.members });
      }
    });
    return result;
  }

  createWhisperGroup(roomId, creatorId, memberIds) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const channelId = 'whisper_' + Math.random().toString(36).substr(2, 9);
    const allMembers = Array.from(new Set([creatorId, ...memberIds]));
    
    // Generate name based on member names
    const names = allMembers.map(id => room.players.get(id)?.name).filter(Boolean);
    const name = names.join(', ');

    const newChannel = { name, type: 'whisper', members: allMembers, messages: [] };
    room.channels.set(channelId, newChannel);
    return { id: channelId, channel: newChannel };
  }

  addChannelMessage(roomId, channelId, messageData) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const ch = room.channels.get(channelId);
    if (!ch) return null;
    
    ch.messages.push(messageData);
    if (ch.messages.length > 100) ch.messages.shift();
    return ch;
  }

  // ── Location Sets Data ───────────────────────────────────────────────────
  getLocationSetsData() {
    return Object.keys(LOCATION_SETS).map(id => ({
      id,
      name: LOCATION_SETS[id].setName,
      locations: LOCATION_SETS[id].locations.map(l => l.name)
    }));
  }
}
