import { useEffect } from 'react';
import socket from '../socket';
import { useGame } from '../context/GameContext';

export function useSocket() {
  const { dispatch } = useGame();

  useEffect(() => {
    // ── Connection ──────────────────────────────────────────────────────
    const onConnect = () => {
      dispatch({ type: 'SET_CONNECTED', payload: { connected: true, socketId: socket.id } });
    };
    const onDisconnect = () => {
      dispatch({ type: 'SET_CONNECTED', payload: { connected: false, socketId: null } });
    };
    const onConnectError = () => {
      dispatch({ type: 'SET_ERROR', payload: 'Cannot reach server. Is it running?' });
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    // ── Room ─────────────────────────────────────────────────────────────
    const onRoomJoined = (data) => dispatch({ type: 'ROOM_JOINED', payload: data });
    const onJoinError = (data) => dispatch({ type: 'SET_ERROR', payload: data.message });
    const onUpdatePlayers = (data) => dispatch({ type: 'UPDATE_PLAYERS', payload: data });
    const onUpdateSettings = (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings });

    // ── Game ─────────────────────────────────────────────────────────────
    const onGameStarted = (data) => dispatch({ type: 'GAME_STARTED', payload: data });

    // ── Voting ───────────────────────────────────────────────────────────
    const onVoteStarted = (data) => dispatch({ type: 'VOTE_STARTED', payload: data });
    const onVoteUpdate = (data) => dispatch({ type: 'VOTE_UPDATE', payload: data });

    // ─── End ─────────────────────────────────────────────────────────────────
    const onGameEnded = (data) => dispatch({ type: 'GAME_ENDED', payload: data });
    const onGameReset = (data) => dispatch({ type: 'GAME_RESET', payload: data });
    const onSpyMustGuess = (data) => dispatch({ type: 'SPY_MUST_GUESS', payload: data });
    // Lobby / Room List
    socket.on('room_list_update', (rooms) => dispatch({ type: 'ROOM_LIST_UPDATE', payload: rooms }));

    // ── Extras ───────────────────────────────────────────────────────────
    const onKicked = (data) => dispatch({ type: 'KICKED', payload: data });
    const onChatChannelsSync = (data) => dispatch({ type: 'CHAT_CHANNELS_SYNC', payload: data });
    const onChatMsgReceived = (data) => dispatch({ type: 'CHAT_MSG_RECEIVED', payload: data });
    const onWhisperCreated = (data) => dispatch({ type: 'WHISPER_CREATED', payload: data });

    const onTimerSync = (data) => dispatch({ type: 'TIMER_SYNC', payload: data });
    const onVoteTimerSync = (data) => dispatch({ type: 'TIMER_SYNC', payload: data });
    const onRoomListUpdate = (rooms) => dispatch({ type: 'ROOM_LIST_UPDATE', payload: rooms });

    // Register all listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room_joined', onRoomJoined);
    socket.on('join_error', onJoinError);
    socket.on('update_players', onUpdatePlayers);
    socket.on('update_settings', onUpdateSettings);
    socket.on('game_started', onGameStarted);
    socket.on('vote_started', onVoteStarted);
    socket.on('vote_update', onVoteUpdate);
    socket.on('game_ended', onGameEnded);
    socket.on('game_reset', onGameReset);
    socket.on('spy_must_guess', onSpyMustGuess);
    socket.on('kicked', onKicked);
    socket.on('chat_channels_sync', onChatChannelsSync);
    socket.on('chat_msg_received', onChatMsgReceived);
    socket.on('whisper_created', onWhisperCreated);
    socket.on('timer_sync', onTimerSync);
    socket.on('vote_timer_sync', onVoteTimerSync);
    socket.on('room_list_update', onRoomListUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room_joined', onRoomJoined);
      socket.off('join_error', onJoinError);
      socket.off('update_players', onUpdatePlayers);
      socket.off('update_settings', onUpdateSettings);
      socket.off('game_started', onGameStarted);
      socket.off('vote_started', onVoteStarted);
      socket.off('vote_update', onVoteUpdate);
      socket.off('game_ended', onGameEnded);
      socket.off('game_reset', onGameReset);
      socket.off('spy_must_guess', onSpyMustGuess);
      socket.off('kicked', onKicked);
      socket.off('chat_channels_sync', onChatChannelsSync);
      socket.off('chat_msg_received', onChatMsgReceived);
      socket.off('whisper_created', onWhisperCreated);
      socket.off('timer_sync', onTimerSync);
      socket.off('vote_timer_sync', onVoteTimerSync);
      socket.off('room_list_update', onRoomListUpdate);
    };
  }, [dispatch]);
}
