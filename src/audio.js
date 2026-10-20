const defaultSettings = {
  master: 0.8,
  ambience: 0.5,
  voice: 0.75,
  sfx: 0.8,
  music: 0.5,
  muted: false,
};

const state = {
  audioCtx: null,
  masterGain: null,
  ambienceGain: null,
  voiceGain: null,
  sfxGain: null,
  musicGain: null,
  settings: { ...defaultSettings },
  initialized: false,
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function loadAudioSettings() {
  try {
    const raw = localStorage.getItem('chaat-chawk-audio');
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveAudioSettings(settings) {
  localStorage.setItem('chaat-chawk-audio', JSON.stringify(settings));
}

export function ensureAudio() {
  if (state.initialized) return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    state.initialized = true;
    return;
  }

  try {
    state.audioCtx = new AudioCtor();
    state.masterGain = state.audioCtx.createGain();
    state.ambienceGain = state.audioCtx.createGain();
    state.voiceGain = state.audioCtx.createGain();
    state.sfxGain = state.audioCtx.createGain();
    state.musicGain = state.audioCtx.createGain();

    state.masterGain.gain.value = 0.8;
    state.ambienceGain.gain.value = 0.5;
    state.voiceGain.gain.value = 0.75;
    state.sfxGain.gain.value = 0.8;
    state.musicGain.gain.value = 0.5;

    state.masterGain.connect(state.audioCtx.destination);
    state.ambienceGain.connect(state.masterGain);
    state.voiceGain.connect(state.masterGain);
    state.sfxGain.connect(state.masterGain);
    state.musicGain.connect(state.masterGain);

    state.settings = loadAudioSettings();
    applyAudioSettings(state.settings);
    state.initialized = true;
  } catch {
    state.initialized = true;
    state.settings = { ...defaultSettings };
  }
}

export function applyAudioSettings(settings) {
  state.settings = { ...defaultSettings, ...settings };
  if (!state.audioCtx) return;

  const muted = Boolean(state.settings.muted);
  const volume = (key) => {
    const value = Number(state.settings[key]);
    return Number.isFinite(value) ? clamp(value) : defaultSettings[key];
  };
  const master = muted ? 0 : volume('master');
  const ambience = muted ? 0 : volume('ambience');
  const voice = muted ? 0 : volume('voice');
  const sfx = muted ? 0 : volume('sfx');
  const music = muted ? 0 : volume('music');

  state.masterGain.gain.value = master;
  state.ambienceGain.gain.value = ambience;
  state.voiceGain.gain.value = voice;
  state.sfxGain.gain.value = sfx;
  state.musicGain.gain.value = music;

  saveAudioSettings(state.settings);
}

export function getAudioSettings() {
  return { ...state.settings };
}

function playTone({ frequency = 440, duration = 0.16, type = 'sine', gain = 0.06, detune = 0, delay = 0 }) {
  if (!state.audioCtx) return;
  const now = state.audioCtx.currentTime + delay;
  const oscillator = state.audioCtx.createOscillator();
  const gainNode = state.audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gainNode);
  gainNode.connect(state.sfxGain || state.masterGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
}

export function playSuccessTone() {
  playTone({ frequency: 659, duration: 0.14, type: 'triangle', gain: 0.12 });
  setTimeout(() => playTone({ frequency: 784, duration: 0.18, type: 'triangle', gain: 0.1 }), 110);
}

export function playMissTone() {
  playTone({ frequency: 220, duration: 0.18, type: 'sawtooth', gain: 0.1 });
}

export function playWrongTone() {
  playTone({ frequency: 180, duration: 0.12, type: 'square', gain: 0.08 });
}

export function playLevelWinTone() {
  playTone({ frequency: 587, duration: 0.18, type: 'triangle', gain: 0.14 });
  setTimeout(() => playTone({ frequency: 784, duration: 0.22, type: 'triangle', gain: 0.14 }), 120);
  setTimeout(() => playTone({ frequency: 988, duration: 0.3, type: 'triangle', gain: 0.14 }), 240);
}

export function playVoiceCall(text) {
  if (!state.audioCtx || state.settings.muted) return;

  const speech = window.speechSynthesis;
  if (!speech) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = state.settings.voice;
  utterance.rate = 0.95;
  utterance.pitch = 1.08;
  utterance.lang = 'en-IN';
  speech.cancel();
  speech.speak(utterance);
}

const vendorCalls = {
  'pani-puri': {
    hindi: 'आइए आइए! पानी पुरी खाइए! तीखा, खट्टा, चटपटा पानी!',
    hinglish: 'Aaiye aaiye! Pani puri khaaiye! Teekha, khatta, chatpata paani!',
  },
  'bhel-puri': {
    hindi: 'भेल पुरी ले लो भैया! खट्टी मीठी, एकदम झकास!',
    hinglish: 'Bhel puri le lo bhaiya! Khatti meethi, ekdum jhakaas!',
  },
  'masala-puri': {
    hindi: 'गरमा गरम मसाला पुरी! एक प्लेट खाओ, मूड बनाओ!',
    hinglish: 'Garma garam masala puri! Ek plate khaao, mood banaao!',
  },
};

export function playStreetVendorCall(recipeId) {
  if (!state.audioCtx || state.settings.muted) return false;
  const speech = window.speechSynthesis;
  if (!speech) return false;
  const call = vendorCalls[recipeId];
  if (!call) return false;

  const voices = speech.getVoices();
  const hindiVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('hi'));
  const indianEnglishVoice = voices.find((voice) => voice.lang.toLowerCase() === 'en-in');
  const voice = hindiVoice || indianEnglishVoice || voices.find((candidate) => candidate.default) || null;
  const utterance = new SpeechSynthesisUtterance(hindiVoice ? call.hindi : call.hinglish);
  utterance.volume = clamp(Number(state.settings.voice), 0, 1);
  utterance.rate = 0.9;
  utterance.pitch = 1.12;
  utterance.lang = hindiVoice ? hindiVoice.lang : indianEnglishVoice ? indianEnglishVoice.lang : 'en-US';
  if (voice) utterance.voice = voice;
  speech.cancel();
  speech.speak(utterance);
  return true;
}

export function stopAllAudio() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (state.audioCtx) {
    state.audioCtx.suspend();
  }
}

export function resumeAudio() {
  if (state.audioCtx && state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
}

export function getAudioState() {
  return { initialized: state.initialized, settings: { ...state.settings } };
}
