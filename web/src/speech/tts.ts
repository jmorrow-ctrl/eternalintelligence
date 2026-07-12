import { hasPiperVoice, speakWithPiper, stopPiperSpeaking } from './piperTts';

let voicesLoaded = false;
let voiceQueue: (() => void)[] = [];

function onVoicesReady(): Promise<void> {
  if (voicesLoaded) return Promise.resolve();
  if (speechSynthesis.getVoices().length > 0) {
    voicesLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    voiceQueue.push(resolve);
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      for (const fn of voiceQueue) fn();
      voiceQueue = [];
    };
  });
}

function findVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  const primary = locale.toLowerCase();
  const [lang] = primary.split('-');

  return voices.find((v) => v.lang.toLowerCase() === primary)
    ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang) && v.localService)
    ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang))
    ?? voices.find((v) => v.lang.toLowerCase().includes(lang));
}

async function speakBrowser(text: string, locale: string): Promise<void> {
  await onVoicesReady();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voice = findVoice(locale);
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    speechSynthesis.speak(utterance);
  });
}

export async function speak(text: string, locale = 'ru-RU'): Promise<void> {
  const langCode = locale.split('-')[0].toLowerCase();

  if (hasPiperVoice(langCode)) {
    try {
      await speakWithPiper(text, langCode);
      return;
    } catch (err) {
      console.warn(`Piper TTS failed for "${langCode}", falling back to browser TTS.`, err);
    }
  }

  await speakBrowser(text, locale);
}

export function stopSpeaking(): void {
  stopPiperSpeaking();
  speechSynthesis.cancel();
}
