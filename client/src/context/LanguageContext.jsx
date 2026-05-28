import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Translation strings ──────────────────────────────────────────────────
const T = {
  en: {
    // App / Connection
    connected: 'Connected',
    disconnected: 'Disconnected',

    // Lobby
    tagline: 'A GAME OF DECEPTION',
    yourName: 'YOUR NAME',
    namePlaceholder: 'Agent 47',
    roomCode: 'ROOM CODE',
    roomCodePlaceholder: 'Enter or roll 🎲',
    joinBtn: 'JOIN GAME',
    joiningBtn: 'JOINING...',
    firstPlayerNote: 'First player to enter a new code becomes the Host.',
    features: ['Real-time Multiplayer', 'Mobile First', 'No Installation'],
    avatarStyle: 'AVATAR STYLE',
    reroll: 'Reroll Avatar',

    // Waiting Room
    gameLobby: 'Game Lobby',
    waitingSubtitle: 'Waiting for players to join...',
    players: 'Players',
    gameSettings: 'Game Settings',
    locationSets: 'Location Sets',
    maxPlayers: 'Max Players',
    spies: 'Spies',
    timerDuration: 'Timer Duration',
    startBtn: '🎮 Start Game',
    need2Players: '⏳ Need 2+ players',
    selectSet: '⚠️ Select a location set',
    leaveRoom: '← Leave Room',
    waitingForHost: 'Waiting for Host',
    hostWillConfigure: 'The host will configure and start the game',
    timerLabel: 'Timer',
    spiesLabel: 'Spies',
    setsLabel: 'Sets',
    shareNote: 'Share the room code with friends to invite them',
    leaderboard: 'Leaderboard',
    spyWinsScore: 'Spy wins (3 pts)',
    detectiveWinsScore: 'Caught spy (1 pt)',
    points: 'pt',
    showLiveVotes: 'Show Live Votes',
    showLiveVotesDesc: 'Players can see who voted for whom during the voting phase.',
    allowWhispers: 'Allow Whispers',
    allowWhispersDesc: 'Players can create custom private group chats.',
    autoStartTimer: 'Auto-start timer',
    votingTime: 'Voting Time',

    // Location Set labels
    setStandard1: 'Standard Set 1',
    setStandard2: 'Standard Set 2',
    setStandard3: 'Standard Set 3',
    setStandardDesc: 'The classic Spyfall locations',
    setFantasy: 'Fantasy',
    setFantasyDesc: 'Castles, dragons, and magic',
    setScifi: 'Sci-Fi',
    setScifiDesc: 'Space stations and futuristic cities',
    setCustom: 'Custom',
    setCustomDesc: 'Create your own locations',
    editCustom: 'Edit Locations',
    customLocations: 'CUSTOM LOCATIONS',
    customLocDesc: 'Enter one location per line.',
    saveBtn: 'Save',

    // Game Page
    gameInProgress: 'Game in Progress',
    yourIdentity:   'Your Identity',
    playersThisRound: 'Players This Round',
    possibleLocations: 'Possible Locations',
    filterPlaceholder: 'Filter locations...',
    emergencyVote: '🚨 Emergency Vote',
    guessLocation: '🎯 Guess Location',
    hereLabel:    '← here',
    totalLabel:   'total',
    spyTipTitle:  'You are the Spy!',
    spyTipDesc:   'Ask subtle questions and blend in. Use "Guess Location" when confident.',
    spyReminder:  "🕵️ You're the spy — listen carefully and guess!",
    cancelVoteBtn: 'Cancel Vote',
    omniscientMode: 'Omniscient Mode',
    doNotSpoil: 'Do NOT spoil the game!',
    trueLocation: 'True Location',
    playerRoles: 'Player Roles',
    firstQuestion: 'First Question',
    youAskFirst: 'You ask the first question!',
    playerAsksFirst: (n) => `👉 ${n} asks the first question!`,

    // Role Card
    tapToReveal:    'Tap to reveal your role',
    tapToHide:      'Tap to hide',
    identityAwaits: 'Your identity awaits...',
    youAreTheSpy:   "You're the Spy!",
    blendInTip:     'Blend in. Guess the location to win.',
    locationLabel:  'Location',
    yourRole:       'Your Role',

    // Timer
    timeLeft: 'Time Left',

    // Spy Guess Modal
    guessModalTitle: '🎯 Guess the Location',
    guessModalDesc:  'A correct guess wins the game for you. Wrong guess = players win!',
    cancel:        'Cancel',
    confirmGuess:  'Confirm',

    // Voting
    voteTitle:       'Vote for the',
    voteSpy:         'Spy!',
    voteInstruction: 'Tap a player you suspect is the spy',
    voteCastMsg:     'Vote cast! Waiting for everyone else...',
    votesCast:       'Votes cast',
    waitingFor:      'Waiting for',
    moreVote:        'more vote',
    moreVotes:       'more votes',
    vote:            'vote',
    votes:           'votes',
    voted:           'Voted',
    cancelVote:      'Cancel Vote',
    changeVote:      'Change Vote',
    confirmVote:     'Confirm Vote',

    // Results
    spyWins:     'The Spy Wins!',
    playersWin:  'Players Win!',
    spyFoundMsg:   (n) => `${n} was correctly identified as the Spy!`,
    innocentMsg:   (n) => `${n} was falsely accused — the Spy got away!`,
    correctGuessMsg: (n) => `${n} correctly guessed the location!`,
    wrongGuessMsg:   (n) => `${n} guessed wrong — the players win!`,
    theSpyWas:    'The Spy Was',
    secretLocation: 'The Secret Location Was',
    spyGuessed:   'Spy guessed:',
    everyonesRoles: "Everyone's Roles",
    playAgain:    '🎮 Play Again',
    leaveGame:    'Leave Room',
    waitingHostNewRound: 'Waiting for the host to start a new round...',
    minutes:      'min',
    revealingResults: 'Revealing Results...',
    spyLabel:     'Spy',
    votingResults: 'Voting Results',
    spyTimeoutMsg: 'The Spy ran out of time to guess the location!',

    // Spy Guessing Phase
    spyCaughtTitle: '🔒 Spy Caught!',
    spyCaughtDesc: (n) => `${n} was the Spy.`,
    spyLastChance: 'You have one last chance to win — Guess the location!',
    waitingSpyGuess: 'Waiting for the Spy to guess the location...',
    selectLocation: 'Select the Location',
    submitGuess: 'Submit Guess',
    loading: 'Loading...',
  },

  th: {
    // App / Connection
    connected: 'เชื่อมต่อแล้ว',
    disconnected: 'ขาดการเชื่อมต่อ',

    // Lobby
    tagline: 'เกมแห่งการหลอกลวง',
    yourName: 'ชื่อของคุณ',
    namePlaceholder: 'สายลับ 47',
    roomCode: 'รหัสห้อง',
    roomCodePlaceholder: 'กรอก หรือสุ่ม 🎲',
    joinBtn: 'เข้าร่วมเกม',
    joiningBtn: 'กำลังเข้าร่วม...',
    firstPlayerNote: 'ผู้เล่นคนแรกที่สร้างห้องจะได้เป็นหัวหน้าห้อง',
    features: ['เล่นพร้อมกันแบบเรียลไทม์', 'รองรับมือถืออย่างสมบูรณ์', 'ไม่ต้องติดตั้ง'],
    avatarStyle: 'สไตล์ตัวละคร',
    reroll: 'สุ่มตัวละครใหม่',

    // Waiting Room
    gameLobby: 'ห้องรอเกม',
    waitingSubtitle: 'รอผู้เล่นเข้าร่วม...',
    players: 'ผู้เล่น',
    gameSettings: 'ตั้งค่าเกม',
    locationSets: 'ชุดสถานที่',
    maxPlayers: 'จำนวนผู้เล่นสูงสุด',
    spies: 'สายลับ',
    timerDuration: 'ระยะเวลา',
    startBtn: '🎮 เริ่มเกม',
    need2Players: '⏳ ต้องการผู้เล่นอย่างน้อย 2 คน',
    selectSet: '⚠️ กรุณาเลือกชุดสถานที่',
    leaveRoom: '← ออกจากห้อง',
    waitingForHost: 'รอเจ้าบ้าน',
    hostWillConfigure: 'เจ้าบ้านจะตั้งค่าและเริ่มเกม',
    timerLabel: 'เวลา',
    spiesLabel: 'สายลับ',
    setsLabel: 'ชุด',
    shareNote: 'แชร์รหัสห้องให้เพื่อนเพื่อเชิญเข้าร่วม',
    leaderboard: 'กระดานคะแนน',
    spyWinsScore: 'ชนะในฐานะสายลับ (3 คะแนน)',
    detectiveWinsScore: 'จับสายลับสำเร็จ (1 คะแนน)',
    points: 'คะแนน',
    showLiveVotes: 'แสดงโหวตสด',
    showLiveVotesDesc: 'ผู้เล่นสามารถเห็นว่าใครโหวตให้ใครในช่วงโหวต',
    allowWhispers: 'อนุญาตแชทลับ',
    allowWhispersDesc: 'ผู้เล่นสามารถสร้างกลุ่มแชทลับส่วนตัวได้',
    autoStartTimer: 'เริ่มเวลาอัตโนมัติ',
    votingTime: 'เวลาโหวต',

    // Location Set labels
    setStandard1: 'มาตรฐาน ชุดที่ 1',
    setStandard2: 'มาตรฐาน ชุดที่ 2',
    setStandard3: 'มาตรฐาน ชุดที่ 3',
    setStandardDesc: 'สถานที่คลาสสิกจากเกม',
    setFantasy: 'แฟนตาซี',
    setFantasyDesc: 'ปราสาท มังกร และเวทมนตร์',
    setScifi: 'ไซไฟ',
    setScifiDesc: 'สถานีอวกาศและเมืองอนาคต',
    setCustom: 'กำหนดเอง',
    setCustomDesc: 'สร้างสถานที่ของคุณเอง',
    editCustom: 'แก้ไขสถานที่',
    customLocations: 'สถานที่กำหนดเอง',
    customLocDesc: 'พิมพ์ชื่อสถานที่บรรทัดละ 1 ชื่อ',
    saveBtn: 'บันทึก',

    // Game Page
    gameInProgress: 'เกมกำลังดำเนินอยู่',
    yourIdentity:   'ตัวตนของคุณ',
    playersThisRound: 'ผู้เล่นในรอบนี้',
    possibleLocations: 'สถานที่ที่เป็นไปได้',
    filterPlaceholder: 'ค้นหาสถานที่...',
    emergencyVote: '🚨 โหวตฉุกเฉิน',
    guessLocation: '🎯 เดาสถานที่',
    hereLabel:   '← ที่นี่',
    totalLabel:  'รายการ',
    spyTipTitle: 'คุณคือสายลับ!',
    spyTipDesc:  'ถามคำถามอย่างแนบเนียน ใช้ "เดาสถานที่" เมื่อมั่นใจ',
    spyReminder: '🕵️ คุณคือสายลับ — ฟังอย่างตั้งใจและเดา!',
    cancelVoteBtn: 'ยกเลิกโหวต',
    omniscientMode: 'โหมดผู้สังเกตการณ์',
    doNotSpoil: 'ห้ามสปอยล์เกม!',
    trueLocation: 'สถานที่จริง',
    playerRoles: 'บทบาทผู้เล่น',
    firstQuestion: 'คำถามแรก',
    youAskFirst: 'คุณเป็นคนเริ่มถามคำถามแรก!',
    playerAsksFirst: (n) => `👉 ${n} เริ่มถามคำถามแรก!`,

    // Role Card
    tapToReveal:    'แตะเพื่อเปิดเผยบทบาทของคุณ',
    tapToHide:      'แตะเพื่อซ่อน',
    identityAwaits: 'ตัวตนของคุณรออยู่...',
    youAreTheSpy:   'คุณคือสายลับ!',
    blendInTip:     'กลมกลืนไป เดาสถานที่เพื่อชนะ',
    locationLabel:  'สถานที่',
    yourRole:       'บทบาทของคุณ',

    // Timer
    timeLeft: 'เวลาที่เหลือ',

    // Spy Guess Modal
    guessModalTitle: '🎯 เดาสถานที่',
    guessModalDesc:  'เดาถูก = คุณชนะ! เดาผิด = ผู้เล่นชนะ!',
    cancel:       'ยกเลิก',
    confirmGuess: 'ยืนยัน',

    // Voting
    voteTitle:       'โหวตหา',
    voteSpy:         'สายลับ!',
    voteInstruction: 'แตะผู้เล่นที่คุณสงสัยว่าเป็นสายลับ',
    voteCastMsg:     'โหวตแล้ว! รอคนอื่นๆ...',
    votesCast:       'โหวตแล้ว',
    waitingFor:      'รออีก',
    moreVote:        'โหวต',
    moreVotes:       'โหวต',
    vote:            'โหวต',
    votes:           'โหวต',
    voted:           'โหวตแล้ว',
    cancelVote:      'ยกเลิกโหวต',
    changeVote:      'เปลี่ยนโหวต',
    confirmVote:     'ยืนยันโหวต',

    // Results
    spyWins:     'สายลับชนะ!',
    playersWin:  'ผู้เล่นชนะ!',
    spyFoundMsg:     (n) => `${n} ถูกระบุว่าเป็นสายลับอย่างถูกต้อง!`,
    innocentMsg:     (n) => `${n} ถูกกล่าวหาอย่างเท็จ — สายลับหนีรอด!`,
    correctGuessMsg: (n) => `${n} เดาสถานที่ถูกต้อง!`,
    wrongGuessMsg:   (n) => `${n} เดาผิด — ผู้เล่นชนะ!`,
    theSpyWas:    'สายลับคือ',
    secretLocation: 'สถานที่ลับคือ',
    spyGuessed:   'สายลับเดา:',
    everyonesRoles: 'บทบาทของทุกคน',
    playAgain:    '🎮 เล่นอีกครั้ง',
    leaveGame:    'ออกจากห้อง',
    waitingHostNewRound: 'รอเจ้าบ้านเริ่มรอบใหม่...',
    minutes:      'นาที',
    revealingResults: 'กำลังเปิดเผยผลลัพธ์...',
    spyLabel:     'สายลับ',
    votingResults: 'ผลการโหวต',
    spyTimeoutMsg: 'สายลับหมดเวลาเดาสถานที่!',

    // Spy Guessing Phase
    spyCaughtTitle: '🔒 จับสายลับได้!',
    spyCaughtDesc: (n) => `${n} คือสายลับ`,
    spyLastChance: 'โอกาสสุดท้าย! เดาสถานที่ให้ถูกเพื่อชนะ!',
    waitingSpyGuess: 'รอสายลับเดาสถานที่...',
    selectLocation: 'เลือกสถานที่',
    submitGuess: 'ยืนยันการเดา',
    loading: 'กำลังโหลด...',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('spyfall-lang') || 'en'; } catch { return 'en'; }
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'th' : 'en';
      try { localStorage.setItem('spyfall-lang', next); } catch {}
      return next;
    });
  }, []);

  const t = useCallback((key, ...args) => {
    const val = T[lang]?.[key] ?? T.en?.[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
