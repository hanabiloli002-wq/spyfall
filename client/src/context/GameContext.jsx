import React, { createContext, useContext, useReducer, useCallback } from 'react';
import socket from '../socket';

// ─── Context ─────────────────────────────────────────────────────────────
const GameContext = createContext(null);

// ─── Initial State ────────────────────────────────────────────────────────
const initialState = {
  // Connection
  connected: false,
  socketId: null,

  // Room
  roomId: null,
  isHost: false,
  hostId: null,

  // Self
  playerName: '',
  scores: {},    // { playerName: { spyWins, detectiveWins } }

  // Game Phase
  phase: 'lobby', // 'lobby' | 'waiting' | 'playing' | 'voting' | 'ended'
  settings: {
    timeLimit: 8,
    locationSets: ['base'],
    numSpies: 1,
    customLocations: [],
    showVotes: false,
    allowWhisper: false,
  },

  // Roles & Game State
  myRole: null,  // string or 'Spectator'
  isSpy: false,
  otherSpies: [],
  currentLocation: null, // { name, roles[] }
  allLocations: [],       // string[]
  firstPlayerId: null,

  // Spectator Data
  fullLocationData: null,
  fullSpyData: null,
  fullPlayersRoles: null,

  // Timer
  timerRunning: false,
  
  // Voting
  votes: [],     // [{ targetId, targetName, voteCount, voters }]
  hasVoted: false,

  // Unified Chat
  channels: [], // array of { id, name, type, messages, memberIds? }
  spyNote: '',

  // End
  gameResult: null,

  // UI
  error: null,
  loading: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: action.payload.connected,
        socketId: action.payload.socketId,
      };

    case 'SET_PLAYER_INFO':
      return {
        ...state,
        playerName: action.payload.playerName,
        avatarUrl: action.payload.avatarUrl,
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ROOM_JOINED':
      return {
        ...state,
        roomId: action.payload.roomId,
        isHost: action.payload.isHost,
        players: action.payload.players,
        settings: action.payload.settings,
        scores: action.payload.scores || {},
        phase: action.payload.state === 'playing' ? 'playing' : 'waiting',
        loading: false,
        error: null,
      };

    case 'UPDATE_PLAYERS':
      return {
        ...state,
        players: action.payload.players,
        isHost: action.payload.host === socket.id,
        hostId: action.payload.host,
        scores: action.payload.scores || state.scores,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'playing',
        isSpy: action.payload.isSpy,
        myRole: action.payload.role,
        currentLocation: action.payload.location,
        allLocations: action.payload.allLocations,
        players: action.payload.players,
        firstPlayerId: action.payload.firstPlayerId,
        otherSpies: action.payload.otherSpies || [],
        fullLocationData: action.payload.fullLocationData || null,
        fullSpyData: action.payload.fullSpyData || null,
        fullPlayersRoles: action.payload.fullPlayersRoles || null,
        timerRunning: true,
        hasVoted: false,
        votes: [],
        gameResult: null,
      };

    case 'VOTE_STARTED':
      return {
        ...state,
        phase: 'voting',
        votes: [],
        hasVoted: false,
      };

    case 'VOTE_UPDATE':
      return { ...state, votes: action.payload.votes };

    case 'HAS_VOTED':
      return { ...state, hasVoted: true };

    case 'GAME_ENDED':
      return {
        ...state,
        phase: 'ended',
        gameResult: action.payload,
        scores: action.payload.scores || state.scores,
      };

    case 'GAME_RESET':
      return {
        ...state,
        phase: 'waiting',
        isSpy: false,
        myRole: null,
        currentLocation: null,
        allLocations: [],
        otherSpies: [],
        timerRunning: false,
        firstPlayerId: null,
        votes: [],
        hasVoted: false,
        gameResult: null,
        players: action.payload.players,
        settings: action.payload.settings,
        isHost: action.payload.host === socket.id,
        hostId: action.payload.host,
      };

    case 'KICKED':
      return {
        ...initialState,
        connected: state.connected,
        socketId: state.socketId,
        error: action.payload.message || 'You were kicked from the room.',
      };
      
    case 'CHAT_CHANNELS_SYNC':
      return { ...state, channels: action.payload };

    case 'CHAT_MSG_RECEIVED': {
      const { channelId, message } = action.payload;
      return {
        ...state,
        channels: state.channels.map(ch => 
          ch.id === channelId 
            ? { ...ch, messages: [...ch.messages, message] }
            : ch
        )
      };
    }

    case 'WHISPER_CREATED':
      return {
        ...state,
        channels: [...state.channels, action.payload]
      };

    case 'SET_SPY_NOTE':
      return { ...state, spyNote: action.payload };

    case 'LEAVE_ROOM':
      return {
        ...initialState,
        connected: state.connected,
        socketId: state.socketId,
      };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const joinRoom = useCallback((roomId, playerName, avatarUrl) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'SET_PLAYER_INFO', payload: { playerName, avatarUrl } });

    if (!socket.connected) socket.connect();

    socket.emit('join_room', { roomId, playerName, avatarUrl });
  }, []);

  const updateSettings = useCallback((settings) => {
    socket.emit('update_settings', settings);
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start_game');
  }, []);

  const triggerVote = useCallback(() => {
    socket.emit('trigger_vote');
  }, []);

  const castVote = useCallback((targetId) => {
    socket.emit('cast_vote', { targetId });
    dispatch({ type: 'HAS_VOTED' });
  }, []);

  const spyGuess = useCallback((locationGuess) => {
    socket.emit('spy_guess', { locationGuess });
  }, []);

  const playAgain = useCallback(() => {
    socket.emit('play_again');
  }, []);

  const toggleTimer = useCallback(() => {
    socket.emit('toggle_timer');
  }, []);

  const kickPlayer = useCallback((targetId) => {
    socket.emit('kick_player', { targetId });
  }, []);
  
  const sendChatMessage = useCallback((channelId, message) => {
    socket.emit('send_chat_msg', { channelId, message });
  }, []);

  const createWhisper = useCallback((memberIds) => {
    socket.emit('create_whisper', { memberIds });
  }, []);

  const setSpyNote = useCallback((note) => {
    dispatch({ type: 'SET_SPY_NOTE', payload: note });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit('leave_room');
    dispatch({ type: 'LEAVE_ROOM' });
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        actions: {
          joinRoom,
          updateSettings,
          startGame,
          triggerVote,
          castVote,
          spyGuess,
          playAgain,
          toggleTimer,
          kickPlayer,
          sendChatMessage,
          createWhisper,
          setSpyNote,
          leaveRoom,
        },
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
