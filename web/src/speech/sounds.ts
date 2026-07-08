let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playTwinkle() {
  const c = getCtx();
  const now = c.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}

export function playSuspense() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 110;
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 1.0);

  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 165;
  gain2.gain.setValueAtTime(0.05, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.7);
}

export function playPeril() {
  const c = getCtx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.8);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 1.0);

  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(110, now + 0.3);
  osc2.frequency.linearRampToValueAtTime(55, now + 1.0);
  gain2.gain.setValueAtTime(0.06, now + 0.3);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  osc2.connect(gain2);
  gain2.connect(c.destination);
  osc2.start(now + 0.3);
  osc2.stop(now + 1.1);
}
