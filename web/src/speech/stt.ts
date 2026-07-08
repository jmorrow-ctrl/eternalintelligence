export interface STTCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (err: string) => void;
}

export interface STTHandle {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
  setCallbacks: (cb: STTCallbacks) => void;
}

export function createRecognizer(lang: string = 'ru-RU'): STTHandle {
  const SpeechRecognitionCtor = (window.SpeechRecognition || window.webkitSpeechRecognition) as
    | (new () => SpeechRecognition)
    | undefined;
  if (!SpeechRecognitionCtor) {
    throw new Error('SpeechRecognition not supported in this browser');
  }

  let callbacks: STTCallbacks | null = null;
  let running = false;
  let manualStop = false;

  const recog = new SpeechRecognitionCtor();
  recog.lang = lang;
  recog.continuous = true;
  recog.interimResults = true;
  recog.maxAlternatives = 1;

  recog.onresult = (event: SpeechRecognitionEvent) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results.item(i);
      if (r.isFinal) {
        final += r[0].transcript;
      } else {
        interim += r[0].transcript;
      }
    }
    if (final && callbacks) callbacks.onFinal(final);
    if (interim && callbacks) callbacks.onInterim(interim);
  };

  recog.onerror = (event: SpeechRecognitionErrorEvent) => {
    running = false;
    if (callbacks) callbacks.onError(event.error);
  };

  recog.onend = () => {
    if (!manualStop && running) {
      try { recog.start(); } catch {
        // ignore restart failures
      }
      return;
    }
    running = false;
  };

  return {
    start() {
      manualStop = false;
      running = true;
      recog.start();
    },
    stop() {
      manualStop = true;
      running = false;
      recog.stop();
    },
    isRunning() {
      return running;
    },
    setCallbacks(cb: STTCallbacks) {
      callbacks = cb;
    },
  };
}
