import { useEffect, useRef, useState, useCallback } from 'react';
import type { Mission } from './shared/game/missions';
import type { TurnRecord } from './shared/game/state';
import { useGameLoop } from './hooks/useGameLoop';
import { speak as ttsSpeak } from './speech/tts';
import { createRecognizer } from './speech/stt';
import { getLanguageSttLocale, getLanguageName } from './speech/locale';
import type { STTHandle } from './speech/stt';
import { playTwinkle, playSuspense, playPeril } from './speech/sounds';
import { VisualCues } from './components/VisualCues';
import { SceneBackground } from './components/SceneBackground';
import { CoverSelection } from './components/CoverSelection';
import type { CoverOption } from './components/CoverSelection';
import { GlobeCountrySelector } from './components/GlobeCountrySelector';
import { RubyText } from './components/RubyText';
import { LANGUAGES } from './languages/config';
import type { LanguageConfig } from './languages/config';
import './App.css';

const DIFFICULTY_OPTIONS: Record<string, { label: string; desc: string }> = {
  beginner: { label: 'Beginner', desc: 'Pronunciation guide' },
  intermediate: { label: 'Intermediate', desc: 'Native text only' },
  advanced: { label: 'Advanced', desc: 'English objective' },
};

const DIFFICULTY_KEYS = Object.keys(DIFFICULTY_OPTIONS) as ('beginner' | 'intermediate' | 'advanced')[];

const DIFF_FILES: Record<string, string> = {
  beginner: '01',
  intermediate: '02',
  advanced: '03',
};

const MULTILINGUAL_CHARS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ中的人了是在不我有大这主上他来以可会あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんþýæðöéíóúáØÅÄ';

const ASCII_BANNER = [
  '███████╗████████╗███████╗██████╗ ███╗   ██╗ █████╗ ██╗     ██╗██╗███╗   ██╗████████╗',
  '██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗  ██║██╔══██╗██║     ██║██║████╗  ██║╚══██╔══╝',
  '█████╗     ██║   █████╗  ██████╔╝██╔██╗ ██║███████║██║     ██║██║██╔██╗ ██║   ██║   ',
  '██╔══╝     ██║   ██╔══╝  ██╔══██╗██║╚██╗██║██╔══██║██║     ██║██║██║╚██╗██║   ██║   ',
  '███████╗   ██║   ███████╗██║  ██║██║ ╚████║██║  ██║███████╗██║██║██║ ╚████║   ██║   ',
  '╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   ',
];

const TITLE_TRANSLATIONS = [
  { lang: 'EN', text: 'ETERNAL INTELLIGENCE' },
  { lang: 'RU', text: 'ВЕЧНАЯ РАЗВЕДКА' },
  { lang: 'ZH', text: '永恒智慧' },
  { lang: 'JA', text: '永遠の知性' },
  { lang: 'IS', text: 'EILÍF GREIND' },
  { lang: 'FR', text: 'RENSEIGNEMENT ÉTERNEL' },
  { lang: 'DE', text: 'EWIGE AUFKLÄRUNG' },
  { lang: 'ES', text: 'INTELIGENCIA ETERNA' },
];

function NameEntryForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <form className="name-entry-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}>
      <input
        className="name-entry-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your full name..."
        autoFocus
        required
      />
      <button className="name-entry-submit" type="submit" disabled={!name.trim()}>
        [ CONTINUE ]
      </button>
    </form>
  );
}

function GlitchOverlay({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="glitch-overlay">
      <div className="glitch-slice" />
      <div className="glitch-slice" />
      <div className="glitch-slice" />
      <div className="glitch-scanlines" />
      <div className="glitch-text">SYSTEM DECLASSIFICATION IN PROGRESS...</div>
    </div>
  );
}

function LaunchScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="launch-screen">
      <div className="launch-topbar">
        <div className="launch-seal">
          <svg viewBox="0 0 40 40" className="launch-seal-svg">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#fecf5e" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fecf5e" strokeWidth="0.5" />
            <path d="M20 6 L22 14 L30 14 L24 19 L26 27 L20 22 L14 27 L16 19 L10 14 L18 14 Z" fill="#fecf5e" opacity="0.8" />
            <text x="20" y="24" textAnchor="middle" fill="#fecf5e" fontSize="6" fontFamily="serif">CIA</text>
          </svg>
        </div>
        <div className="launch-headings">
          <div className="launch-agency">CENTRAL INTELLIGENCE AGENCY</div>
          <div className="launch-community">INTELLIGENCE COMMUNITY</div>
        </div>
      </div>

      <div className="launch-body">
        <div className="launch-notice">
          <div className="launch-notice-icon">⚠</div>
          <p>You are accessing a U.S. Government information system. Usage may be monitored, recorded, and subject to audit. Unauthorized access is prohibited by law (18 U.S.C. § 1030).</p>
        </div>

        <div className="launch-divider" />

        <p className="launch-welcome">
          Welcome, operative. A secure, classified terminal awaits.
        </p>

        <button
          className="launch-enter-btn"
          onClick={onEnter}
        >
          ENTER CLASSIFIED TERMINAL
        </button>

        <p className="launch-classified">// CLASSIFIED //</p>
      </div>

      <div className="launch-footer">
        <span>Central Intelligence Agency</span>
        <span>•</span>
        <span>Washington, D.C.</span>
        <span>•</span>
        <span>eternalintelligence.gov</span>
      </div>
    </div>
  );
}

function TerminalMenu({ onSelect, coverIdentity, language }: {
  onSelect: (fileKey: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  coverIdentity: string;
  language: LanguageConfig;
}) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [bannerChars, setBannerChars] = useState(ASCII_BANNER);
  const [breathOffset, setBreathOffset] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [titleIndex, setTitleIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const breathRef = useRef(0);
  const cycleCountRef = useRef(-1);
  const titleCountRef = useRef(0);

  useEffect(() => {
    const cursorInt = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(cursorInt);
  }, []);

  // Breathing animation + banner reset at rest
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const cycleTime = 8;
      const currentCycle = Math.floor(elapsed / cycleTime);

      if (currentCycle > cycleCountRef.current) {
        setBannerChars(ASCII_BANNER);
        cycleCountRef.current = currentCycle;
      }

      const rawPhase = (elapsed % cycleTime) / cycleTime;
      const phase = rawPhase * Math.PI * 2;
      const offset = (Math.sin(phase - Math.PI / 2) + 1) / 2;
      breathRef.current = offset;
      setBreathOffset(offset);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Gentle character cycling — only during breath expansion
  useEffect(() => {
    const charInt = setInterval(() => {
      if (breathRef.current < 0.05) return;
      setBannerChars((prev) => prev.map((line) => {
        const chars = [...line];
        const numSwap = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numSwap; i++) {
          const idx = Math.floor(Math.random() * chars.length);
          if (chars[idx] !== ' ' && chars[idx] !== '█') {
            chars[idx] = MULTILINGUAL_CHARS[Math.floor(Math.random() * MULTILINGUAL_CHARS.length)];
          }
        }
        return chars.join('');
      }));
    }, 400);
    return () => clearInterval(charInt);
  }, []);

  // Title language: every 3rd = English, rest = random non-English
  useEffect(() => {
    const titleInt = setInterval(() => {
      titleCountRef.current++;
      if (titleCountRef.current % 3 === 0) {
        setTitleIndex(0);
      } else {
        let idx;
        do { idx = Math.floor(Math.random() * TITLE_TRANSLATIONS.length); }
        while (idx === 0);
        setTitleIndex(idx);
      }
    }, 4500);
    return () => clearInterval(titleInt);
  }, []);

  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  const spacedBanner = bannerChars.map((line) => {
    const extra = Math.round(breathOffset * 1);
    if (extra === 0) return line;
    const chars = [...line];
    return chars.map((c) => (c === ' ' ? ' ' : c + ' '.repeat(extra))).join('');
  });

  const currentTitle = TITLE_TRANSLATIONS[titleIndex];

  return (
    <div className="terminal-menu" ref={menuRef} tabIndex={0}>
      <div className="ascii-banner-container">
        <pre className="ascii-banner">{spacedBanner.join('\n')}</pre>
      </div>

      <div className="terminal-title-line">
        <span className="terminal-title" key={currentTitle.lang}>
          {currentTitle.text}
        </span>
        <span className={`cursor ${showCursor ? 'visible' : ''}`}>█</span>
      </div>

      <div className="terminal-lang-tag">[{currentTitle.lang}]</div>

      <div className="terminal-subtitle">
        <span className="terminal-script">РУССКИЙ ЯЗЫК</span>
        <span className="terminal-script">中文</span>
        <span className="terminal-script">日本語</span>
        <span className="terminal-script">ÍSLENSKA</span>
      </div>

      <div className="terminal-separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className="terminal-cover-row">
        <span className="terminal-cover-label">COVER:</span>
        <span className="terminal-cover-value">{coverIdentity.toUpperCase()}</span>
      </div>

      <div className="terminal-separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>

      <div className="terminal-difficulty-label">SELECT MISSION:</div>

      <div className="terminal-level-list">
        {DIFFICULTY_KEYS.map((dk, i) => {
          const theme = language.missionThemes[dk];
          return (
            <div key={dk} className="terminal-level-row">
              <button
                className={`terminal-level-btn ${selectedLevel === dk ? 'active' : ''}`}
                onClick={() => setSelectedLevel(dk === selectedLevel ? null : dk)}
              >
                <span className="terminal-diff-bracket">[</span>
                <span className="terminal-diff-key">{i + 1}</span>
                <span className="terminal-diff-bracket">]</span>
                <span className="terminal-diff-label"> {theme.title}</span>
              </button>

              {selectedLevel === dk && (
                <div className="terminal-diff-sub">
                  {DIFFICULTY_KEYS.map((subDk, di) => (
                    <button
                      key={subDk}
                      className="terminal-sub-btn"
                      onClick={() => onSelect(`${language.code}/${DIFF_FILES[dk]}`, subDk)}
                    >
                      <span className="terminal-diff-bracket">[</span>
                      <span className="terminal-diff-key">{String.fromCharCode(65 + di)}</span>
                      <span className="terminal-diff-bracket">]</span>
                      <span className="terminal-diff-label"> {DIFFICULTY_OPTIONS[subDk].label}</span>
                      <span className="terminal-diff-desc">{DIFFICULTY_OPTIONS[subDk].desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="terminal-prompt">
        <span className="terminal-prompt-user">agent@eternal-intelligence</span>
        <span className="terminal-prompt-sep">:</span>
        <span className="terminal-prompt-path">~</span>
        <span className="terminal-prompt-sep">$</span>
        <span className={`terminal-prompt-cursor ${showCursor ? 'visible' : ''}`}>█</span>
      </div>
    </div>
  );
}

function WordDisplay({ prompt }: { prompt: string }) {
  const words = prompt.split(/(\s+)/);
  return (
    <div className="word-display">
      {words.map((w, i) => (
        <span key={i} className="word">{w}</span>
      ))}
    </div>
  );
}

function SuspicionBar({ value }: { value: number }) {
  const segments = 20;
  const filled = Math.round((value / 100) * segments);
  const bars = [];
  for (let i = 0; i < segments; i++) {
    const cls = i < filled
      ? value >= 80 ? 'bar red' : value >= 50 ? 'bar yellow' : 'bar green'
      : 'bar empty';
    bars.push(<div key={i} className={cls} />);
  }
  return (
    <div className="suspicion-bar-wrap">
      <span className="suspicion-label">Suspicion</span>
      <div className="suspicion-bar">{bars}</div>
      <span className="suspicion-value">{value}%</span>
    </div>
  );
}

function ScoreCard({ grade, turn }: {
  grade: import('./shared/game/grader').GradeResult;
  turn: number;
}) {
  const scoreColor = grade.pronunciation_score >= 80 ? '#00ff41'
    : grade.pronunciation_score >= 60 ? '#fecf5e'
    : '#f87171';
  const deltaColor = grade.suspicion_delta >= 0 ? '#f87171' : '#00ff41';
  const deltaSign = grade.suspicion_delta >= 0 ? '+' : '';

  return (
    <div className="score-card">
      <div className="score-header">TURN {turn} — RESULTS</div>
      <div className="score-row">
        <span className="score-label">SCORE</span>
        <span className="score-value" style={{ color: scoreColor }}>{grade.pronunciation_score}/100</span>
      </div>
      <div className="score-row">
        <span className="score-label">NOTE</span>
        <span className="score-note">{grade.accuracy_note}</span>
      </div>
      <div className="score-row">
        <span className="score-label">SUSPICION Δ</span>
        <span style={{ color: deltaColor }}>{deltaSign}{grade.suspicion_delta}</span>
      </div>
      {grade.coaching_tip && (
        <div className="score-row">
          <span className="score-label">TIP</span>
          <span className="score-tip">{grade.coaching_tip}</span>
        </div>
      )}
    </div>
  );
}

function Recap({ history }: { history: TurnRecord[] }) {
  const missed = history.flatMap((r) => {
    if (!r.phonemeFeedback) return [];
    try {
      const words: { Word: string; AccuracyScore?: number }[] = JSON.parse(r.phonemeFeedback);
      return words.filter((w) => (w.AccuracyScore ?? 100) < 70)
        .map((w) => ({ turn: r.turn, word: w.Word, score: Math.round(w.AccuracyScore ?? 0) }));
    } catch {
      return [];
    }
  });

  return (
    <div className="recap">
      <h2>PERFORMANCE RECAP</h2>
      {missed.length === 0 ? (
        <p className="dim">No pronunciation data available.</p>
      ) : (
        <div className="missed-words">
          {missed.map((m, i) => (
            <div key={i} className="missed-word">
              <span className="missed-turn">T{m.turn}</span>
              <span className="missed-text">{m.word}</span>
              <span className="missed-score" style={{ color: m.score < 30 ? '#f87171' : m.score < 50 ? '#fecf5e' : '#fff' }}>
                {m.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseInput({ onSubmit, noSpeech, languageCode }: { onSubmit: (text: string) => void; noSpeech: boolean; languageCode: string }) {
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const recognizerRef = useRef<STTHandle | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const finalBufRef = useRef('');
  const finalizingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
      if (finalizingTimer.current) clearTimeout(finalizingTimer.current);
    };
  }, []);

  const commitSubmit = (finalText: string) => {
    if (!finalText.trim()) return;
    onSubmit(finalText.trim());
    setText('');
    setInterim('');
    setFinalizing(false);
    finalBufRef.current = '';
  };

  const handleSubmit = () => {
    if (!text.trim() || finalizing) return;

    recognizerRef.current?.stop();
    setIsListening(false);
    setFinalizing(true);

    finalizingTimer.current = setTimeout(() => {
      commitSubmit(finalBufRef.current || text);
    }, 1500);
  };

  const toggleMic = () => {
    if (finalizing) return;

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setText('');
      setInterim('');
      finalBufRef.current = '';
      try {
        const recog = createRecognizer(getLanguageSttLocale(languageCode));
        recognizerRef.current = recog;
        recog.setCallbacks({
          onInterim: (partial) => {
            if (!finalizing) setInterim(partial);
          },
          onFinal: (phrase) => {
            finalBufRef.current += (finalBufRef.current ? ' ' : '') + phrase;
            setText(finalBufRef.current);
            setInterim('');
          },
          onError: () => { if (!finalizing) setIsListening(false); },
        });
        recog.start();
        setIsListening(true);
      } catch {
        // Speech not supported — user types
      }
    }
  };

  return (
    <div className="response-input">
      <div className="input-row">
        <input
          ref={inputRef}
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Use mic or type response"
          lang={languageCode}
          autoFocus
          disabled={finalizing}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        {!noSpeech && (
          <button
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleMic}
            disabled={finalizing}
            title={isListening ? 'Stop recording' : 'Start speech recognition'}
          >
            {isListening ? '◼' : '🎤'}
          </button>
        )}
        <button className="submit-btn" onClick={handleSubmit} disabled={!text.trim() || finalizing}>
          {finalizing ? '...' : 'Send'}
        </button>
      </div>
      {isListening && (
        <div className="mic-status">
          <span className="mic-pulse" />
          {interim ? (
            <span className="interim-text">{interim}</span>
          ) : (
            `Listening... speak in ${getLanguageName(languageCode)}`
          )}
        </div>
      )}
      {finalizing && (
        <div className="mic-status">
          <span className="finalizing-dot" />
          Finalizing speech... (1.5s)
        </div>
      )}
    </div>
  );
}

function DebriefScreen({ mission, onBegin, onBack }: {
  mission: Mission;
  onBegin: () => void;
  onBack: () => void;
}) {
  const [showEn, setShowEn] = useState(false);
  return (
    <div className="debrief-screen">
      <h2 className="debrief-title">{mission.title}</h2>
      <div className="debrief-setting">{mission.setting}</div>
      <div className="debrief-body">
        <p className="debrief-ru">{mission.debriefRu}</p>
        {showEn && <p className="debrief-en">{mission.debriefEn}</p>}
      </div>
      <div className="debrief-actions">
        <button className="back-btn" onClick={onBack}>[ BACK ]</button>
        <button className="translate-btn" onClick={() => setShowEn((v) => !v)}>
          [{showEn ? 'HIDE' : 'SHOW'} TRANSLATION]
        </button>
        <button className="next-btn" onClick={onBegin}>[ BEGIN MISSION ]</button>
      </div>
    </div>
  );
}

type ChatEntry = {
  type: 'npc' | 'user';
  line: string;
  translation?: string;
  turn: number;
};

function GameView({
  game,
  noSpeech,
  coverIdentity,
  language,
}: {
  game: ReturnType<typeof useGameLoop>;
  noSpeech: boolean;
  coverIdentity: string;
  language: LanguageConfig;
}) {
  const { phase, mission, state, grade, isSpeaking } = game;
  const [showScore, setShowScore] = useState(false);
  const [showNpcLine, setShowNpcLine] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRuby, setShowRuby] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, phase]);

  const playNpcLine = useCallback(async (line = state?.npcLastLine): Promise<boolean> => {
    if (!line || !state || isSpeaking) return false;
    game.setIsSpeaking(true);
    try {
      await ttsSpeak(line, language.sttLocale);
    } catch {
      // TTS not supported or failed; continue silently
    }
    game.setIsSpeaking(false);
    return true;
  }, [state, isSpeaking, game, language.sttLocale]);

  const handleTranscript = async (transcript: string) => {
    const currentTurn = state!.currentTurn;
    setChatHistory((prev) => [...prev, { type: 'user', line: transcript, turn: currentTurn }]);
    const delta = await game.submitTranscript(transcript);
    setShowScore(true);
    if (delta != null) {
      if (delta > 0) playPeril();
      else if (delta >= -3) playSuspense();
      else playTwinkle();
    }
  };

  const handleNextTurn = () => {
    setShowScore(false);
    setShowNpcLine(false);
    setShowPrompt(false);
    if (state && state.currentTurn >= state.totalTurns) {
      game.showRecap();
    } else {
      game.advanceTurn();
    }
  };

  // Voice-first flow: speak the NPC line, then reveal the text and user prompt.
  useEffect(() => {
    if (phase === 'turn_start' && state) {
      setShowNpcLine(false);
      setShowPrompt(false);
      playNpcLine().then(() => {
        setShowNpcLine(true);
        setTimeout(() => setShowPrompt(true), 600);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state?.currentTurn]);

  useEffect(() => {
    if (showNpcLine && state) {
      setChatHistory((prev) => {
        const exists = prev.some((e) => e.type === 'npc' && e.turn === state.currentTurn);
        if (exists) return prev;
        return [...prev, {
          type: 'npc' as const,
          line: state.npcLastLine,
          translation: state.npcLastTranslation,
          turn: state.currentTurn,
        }];
      });
    }
  }, [showNpcLine, state]);

  if (phase === 'recap') {
    return (
      <div className="game-view">
        <div className="recap-screen">
          <Recap history={state!.history} />
          <button className="back-btn" onClick={game.backToMenu}>[ BACK TO MENU ]</button>
        </div>
      </div>
    );
  }

  if (phase === 'debrief') {
    return (
      <div className="game-view">
        <DebriefScreen
          mission={mission!}
          onBegin={() => { game.beginMission(); }}
          onBack={game.backToMenu}
        />
      </div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="game-view">
        <div className="game-over">
          <h1>МИССИЯ ПРОВАЛЕНА</h1>
          <p>You have been compromised.</p>
          <Recap history={state!.history} />
          <button className="back-btn" onClick={game.backToMenu}>[ BACK TO MENU ]</button>
        </div>
      </div>
    );
  }

  const turn = mission!.turns[state!.currentTurn - 1];

  return (
    <div className="game-view">
      <SceneBackground setting={mission!.setting} />

      <div className="game-header">
        <span className="turn-count">TURN {state!.currentTurn}/{state!.totalTurns}</span>
        <SuspicionBar value={state!.suspicion} />
        <button className="quit-btn" onClick={game.backToMenu} title="Quit mission">✕</button>
      </div>

      <div className="chat-area">
        {chatHistory.map((entry, i) => (
          entry.type === 'npc' ? (
            <div key={i} className="chat-row npc-row">
              <div className="chat-header">
                <span className="chat-name">{mission!.npc.name.split(' ').slice(1).join(' ') || mission!.npc.name}</span>
                <span className="chat-title">{mission!.npc.name.split(' ')[0]}</span>
              </div>
              <div className={`chat-bubble ${isSpeaking && i === chatHistory.length - 1 ? 'speaking' : ''}`}>
                <div className="npc-line">{entry.line}</div>
                {entry.translation && <div className="npc-translation">{entry.translation}</div>}
                <button
                  className="replay-btn"
                  onClick={() => { game.setIsSpeaking(true); ttsSpeak(entry.line, language.sttLocale).finally(() => game.setIsSpeaking(false)); }}
                  disabled={isSpeaking}
                >
                  {isSpeaking && i === chatHistory.length - 1 ? 'SPEAKING...' : '[ REPLAY ]'}
                </button>
              </div>
            </div>
          ) : (
            <div key={i} className="chat-row user-row">
              <div className="chat-header user-header">
                <span className="chat-name">COVER: {coverIdentity.toUpperCase()}</span>
              </div>
              <div className="chat-bubble user-bubble">
                <div className="user-line">{entry.line}</div>
              </div>
            </div>
          )
        ))}
        <div ref={chatEndRef} />
      </div>

      {phase === 'turn_start' && turn && showPrompt && (
        <div className="prompt-section">
          <div className="prompt-header">
            YOUR LINE
            <span className="lang-badge">{language.flag}</span>
            <span className="diff-badge">{state!.difficulty.toUpperCase()}</span>
            {language.requiresRuby && state!.difficulty !== 'advanced' && turn.prompt.tokens && (
              <button className="ruby-toggle" onClick={() => setShowRuby((v) => !v)}>
                [{showRuby ? 'HIDE RUBY' : 'SHOW RUBY'}]
              </button>
            )}
          </div>
          {state!.difficulty === 'advanced' ? (
            <p className="instruction-line">{turn.instruction || turn.prompt.en}</p>
          ) : language.requiresRuby && turn.prompt.tokens ? (
            <>
              <div className="ruby-line" lang={language.code}>
                <RubyText tokens={turn.prompt.tokens} showRuby={showRuby} />
              </div>
              {state!.difficulty === 'beginner' && (
                <p className="phonetic">{turn.prompt.ru}</p>
              )}
            </>
          ) : (
            <>
              <WordDisplay prompt={turn.prompt.native_script || turn.prompt.ru} />
              {state!.difficulty === 'beginner' && (
                <p className="phonetic">{turn.prompt.phonetic}</p>
              )}
            </>
          )}
          <ResponseInput onSubmit={handleTranscript} noSpeech={noSpeech} languageCode={language.code} />
        </div>
      )}

      {phase === 'turn_start' && !showNpcLine && !showPrompt && (
        <div className="awaiting-continue">
          <span className="mic-pulse" />
          <span className="dim">NPC speaking...</span>
        </div>
      )}

      {phase === 'turn_start' && showNpcLine && !showPrompt && (
        <div className="awaiting-continue">
          <span className="mic-pulse" />
          <span className="dim">Review the line, then respond...</span>
        </div>
      )}

      {phase === 'grading' && (
        <div className="grading-spinner">EVALUATING...</div>
      )}

      {phase === 'results' && showScore && grade && turn && (
        <div className="result-section">
          <VisualCues prompt={turn.prompt.ru} />
          <ScoreCard grade={grade} turn={state!.currentTurn} />

          {state!.difficulty === 'beginner' && (
            <div className="target-translation-feedback">
              <p className="target-line">{turn.prompt.ru}</p>
              <p className="target-translation">{turn.prompt.en}</p>
            </div>
          )}

          <button className="next-btn" onClick={handleNextTurn}>
            [{state!.currentTurn >= state!.totalTurns ? 'SEE RECAP' : 'NEXT TURN'}]
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [launchPhase, setLaunchPhase] = useState<'splash' | 'name' | 'cover' | 'language' | 'transition' | 'done'>('splash');
  const [realName, setRealName] = useState('');
  const [coverIdentity, setCoverIdentity] = useState('Tourist');
  const [language, setLanguage] = useState<LanguageConfig>(LANGUAGES[0]);
  const game = useGameLoop();
  const [noSpeech, setNoSpeech] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const inTerminal = launchPhase === 'done' || launchPhase === 'transition';
    document.body.classList.toggle('launch-mode', !inTerminal);
    document.body.classList.toggle('terminal-mode', inTerminal);
  }, [launchPhase]);

  const loadMission = async (fileKey: string, difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setLoadError('');
    try {
      const res = await fetch(`/missions/${fileKey}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const m: Mission = await res.json();
      game.startMission(m, difficulty);
    } catch (e) {
      setLoadError(`Failed to load mission: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleSelectCover = useCallback((option: CoverOption) => {
    setCoverIdentity(option.coverRole);
    setLaunchPhase('language');
  }, []);

  const handleSelectLanguage = useCallback((lang: LanguageConfig) => {
    setLanguage(lang);
    setLaunchPhase('transition');
  }, []);

  const handleBackToCover = useCallback(() => {
    setLaunchPhase('cover');
  }, []);

  const handleEnterName = useCallback((name: string) => {
    setRealName(name);
    setLaunchPhase('cover');
  }, []);

  const handleExitTerminal = useCallback(() => {
    game.backToMenu();
    setLaunchPhase('language');
  }, [game]);

  if (launchPhase === 'splash') {
    return <LaunchScreen onEnter={() => setLaunchPhase('name')} />;
  }

  if (launchPhase === 'name') {
    return (
      <div className="name-entry-screen">
        <div className="name-entry-modal">
          <div className="name-entry-seal">
            <svg viewBox="0 0 40 40" className="launch-seal-svg">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#fecf5e" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#fecf5e" strokeWidth="0.5" />
              <path d="M20 6 L22 14 L30 14 L24 19 L26 27 L20 22 L14 27 L16 19 L10 14 L18 14 Z" fill="#fecf5e" opacity="0.8" />
              <text x="20" y="24" textAnchor="middle" fill="#fecf5e" fontSize="6" fontFamily="serif">CIA</text>
            </svg>
          </div>
          <h2 className="name-entry-heading">AGENT REGISTRATION</h2>
          <p className="name-entry-sub">Enter your real name to begin clearance processing:</p>
          <NameEntryForm onSubmit={handleEnterName} />
        </div>
      </div>
    );
  }

  if (launchPhase === 'cover') {
    return (
      <div className="cover-screen">
        <CoverSelection realName={realName} onSelect={handleSelectCover} />
      </div>
    );
  }

  if (launchPhase === 'language') {
    return (
      <div className="globe-screen">
        <GlobeCountrySelector onSelect={handleSelectLanguage} onBack={handleBackToCover} />
      </div>
    );
  }

  if (launchPhase === 'transition') {
    return <GlitchOverlay onComplete={() => setLaunchPhase('done')} />;
  }

  return (
    <div className="app terminal-theme">
      {game.phase === 'menu' && (
        <div className="menu">
          <TerminalMenu onSelect={loadMission} coverIdentity={coverIdentity} language={language} />
          {loadError && <p className="load-error">ERROR: {loadError}</p>}
          <div className="terminal-actions">
            <button className="terminal-toggle-btn" onClick={() => setNoSpeech((v) => !v)}>
              [ MIC: {noSpeech ? 'OFF' : 'ON'} ]
            </button>
            <button className="terminal-exit-btn" onClick={handleExitTerminal}>
              [ EXIT TERMINAL ]
            </button>
          </div>
        </div>
      )}

      {game.phase !== 'menu' && game.mission && game.state && (
        <GameView
          game={game}
          noSpeech={noSpeech}
          coverIdentity={coverIdentity}
          language={language}
        />
      )}
    </div>
  );
}

export default App;
