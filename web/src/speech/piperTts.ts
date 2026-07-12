import { TtsSession, WASM_BASE } from '@mintplex-labs/piper-tts-web';

// Medium quality where available; es_MX has no medium voice, so we use its
// only substantial (high) voice. Japanese has no Piper voice at all — the
// caller falls back to the browser's speechSynthesis for 'ja'.
const PIPER_VOICES: Record<string, string> = {
  ru: 'ru_RU-ruslan-medium',
  is: 'is_IS-bui-medium',
  de: 'de_DE-thorsten-medium',
  fr: 'fr_FR-siwis-medium',
  zh: 'zh_CN-huayan-medium',
  es: 'es_MX-claude-high',
};

// The library's default onnxWasm CDN path (cdnjs) 404s — self-host the
// onnxruntime-web WASM assets instead (see scripts/copy-onnx-wasm.mjs).
const WASM_PATHS = {
  onnxWasm: '/onnxruntime-web/',
  piperData: `${WASM_BASE}.data`,
  piperWasm: `${WASM_BASE}.wasm`,
};

let currentAudio: HTMLAudioElement | null = null;
let loadedVoiceId: string | null = null;

export function hasPiperVoice(langCode: string): boolean {
  return langCode in PIPER_VOICES;
}

async function getSession(voiceId: string): Promise<TtsSession> {
  // TtsSession is an internal singleton that does NOT reload its model when
  // handed a different voiceId on an existing instance — it just relabels
  // itself while still running inference with whatever model loaded first.
  // Force a fresh instance whenever the requested voice actually changes.
  if (loadedVoiceId !== voiceId) {
    TtsSession._instance = null;
  }
  const session = await TtsSession.create({ voiceId, wasmPaths: WASM_PATHS });
  loadedVoiceId = voiceId;
  return session;
}

export async function speakWithPiper(text: string, langCode: string): Promise<void> {
  const voiceId = PIPER_VOICES[langCode];
  if (!voiceId) throw new Error(`No Piper voice configured for language "${langCode}"`);

  const session = await getSession(voiceId);
  const wav = await session.predict(text);

  return new Promise((resolve, reject) => {
    const audio = new Audio(URL.createObjectURL(wav));
    currentAudio = audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Piper audio playback failed'));
    audio.play().catch(reject);
  });
}

export function stopPiperSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
