// audio.js – Procedural Web Audio API sounds for Dosenwerfen

let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, type, duration, gain, decay = duration * 0.8) {
  try {
    const ac = ensureCtx();
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gainNode.gain.setValueAtTime(gain, ac.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.05);
  } catch (e) {}
}

function playNoise(duration, gain, filterFreq = 1000) {
  try {
    const ac = ensureCtx();
    const bufSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, ac.currentTime);
    filter.Q.setValueAtTime(0.8, ac.currentTime);
    const gainNode = ac.createGain();
    gainNode.gain.setValueAtTime(gain, ac.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ac.destination);
    source.start();
    source.stop(ac.currentTime + duration);
  } catch (e) {}
}

const Audio = {
  enabled: true,

  throw() {
    if (!this.enabled) return;
    // whoosh
    try {
      const ac = ensureCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      osc.start();
      osc.stop(ac.currentTime + 0.35);
    } catch (e) {}
  },

  hit() {
    if (!this.enabled) return;
    // metallic clank
    playNoise(0.08, 0.4, 2400);
    playTone(180, 'square', 0.15, 0.2);
    playTone(260, 'sawtooth', 0.1, 0.15);
  },

  canTopple() {
    if (!this.enabled) return;
    playNoise(0.12, 0.35, 1800);
    playTone(140, 'square', 0.2, 0.18);
  },

  coin() {
    if (!this.enabled) return;
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.15, 0.25), i * 60);
    });
  },

  levelComplete() {
    if (!this.enabled) return;
    const melody = [523, 659, 784, 1047, 1047, 784, 1047];
    melody.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.2, 0.3), i * 120);
    });
  },

  gameOver() {
    if (!this.enabled) return;
    const melody = [392, 349, 330, 294];
    melody.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sawtooth', 0.25, 0.2), i * 150);
    });
  },

  unlock() {
    if (!this.enabled) return;
    const melody = [659, 784, 1047, 1319];
    melody.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.18, 0.3), i * 80);
    });
  },

  bounce() {
    if (!this.enabled) return;
    playNoise(0.05, 0.2, 3000);
  },
};

export default Audio;
