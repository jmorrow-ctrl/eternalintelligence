import { CURRICULUM, DifficultyLevel } from '../curriculum';
import type { Mission } from './missions';
import type { GameState } from './state';

export interface GradeResult {
  pronunciation_score: number;
  accuracy_note: string;
  suspicion_delta: number;
  npc_response: string;
  npc_response_translation: string;
  coaching_tip: string;
  missed_words: string[];
}

export interface TurnReply {
  ru: string;
  en: string;
}

function getTurnReply(mission: Mission, state: GameState): [string, string] {
  const turn = mission.turns[state.currentTurn - 1];
  if (turn && turn.npcReply) {
    return [turn.npcReply.ru, turn.npcReply.en];
  }
  // Default language-aware fallback so every mission still has an NPC response.
  switch (mission.language) {
    case 'ru': return ['Понятно.', '(I see.)'];
    case 'es': return ['Entendido.', '(Understood.)'];
    case 'fr': return ["D'accord.", '(Okay.)'];
    case 'de': return ['Alles klar.', '(All right.)'];
    case 'is': return ['Ég skil.', '(I understand.)'];
    case 'ja': return ['わかりました。', '(Understood.)'];
    case 'zh': return ['明白了。', '(Understood.)'];
    default: return ['Understood.', '(Understood.)'];
  }
}

// CJK unified ideographs + hiragana + katakana + Latin + Cyrillic + Icelandic diacritics.
const KEEP_RE = /[^\p{L}\p{Nd}\p{P}\p{S}\s]/gu;

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(KEEP_RE, '')
    .replace(/[.,!?;:"'()「」『』（）【】、。！？]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function normalizeCjk(text: string): string {
  // Strip whitespace for CJK text so each character/word becomes comparable.
  return text.replace(/\s+/g, '');
}

function looksCjk(word: string): boolean {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(word);
}

function wordSimilarity(transcript: string, reference: string): number {
  // For CJK-like references, compare character overlap instead of space-split words.
  if (looksCjk(reference)) {
    const t = normalizeCjk(transcript);
    const r = normalizeCjk(reference);
    if (r.length === 0) return 100;
    if (t.length === 0) return 0;
    const set = new Set(t);
    let matched = 0;
    for (const ch of r) if (set.has(ch)) matched++;
    return Math.min(100, (matched / r.length) * 100);
  }

  const words = normalize(transcript);
  const refWords = normalize(reference);
  if (refWords.length === 0) return 100;
  if (words.length === 0) return 0;

  let matched = 0;
  const used = new Array(words.length).fill(false);
  for (const rw of refWords) {
    for (let i = 0; i < words.length; i++) {
      if (!used[i] && words[i] === rw) {
        matched++;
        used[i] = true;
        break;
      }
    }
  }
  return (matched / refWords.length) * 100;
}

function findMissedWords(transcript: string, reference: string): string[] {
  if (looksCjk(reference)) {
    const t = normalizeCjk(transcript);
    const set = new Set(t);
    const missed: string[] = [];
    const seen = new Set<string>();
    for (const ch of normalizeCjk(reference)) {
      if (!set.has(ch) && !seen.has(ch)) {
        missed.push(ch);
        seen.add(ch);
      }
    }
    return missed;
  }

  const words = normalize(transcript);
  const refWords = normalize(reference);
  const missed: string[] = [];
  const used = new Array(words.length).fill(false);
  for (const rw of refWords) {
    let found = false;
    for (let i = 0; i < words.length; i++) {
      if (!used[i] && words[i] === rw) {
        found = true;
        used[i] = true;
        break;
      }
    }
    if (!found) missed.push(rw);
  }
  return missed;
}

const COACHING_PHRASES = [
  'Try pronouncing',
  'Focus on',
  'Pay attention to',
];

export function gradeTranscript(
  transcript: string,
  mission: Mission,
  state: GameState,
  pronunciationScore?: number,
  phonemeFeedback?: string,
): GradeResult {
  const turn = mission.turns[state.currentTurn - 1];
  const referenceText = turn
    ? (turn.prompt.native_script || turn.prompt.ru)
    : '';
  const similarity = turn ? wordSimilarity(transcript, referenceText) : 50;
  const tier = CURRICULUM[mission.difficulty as DifficultyLevel] || CURRICULUM[DifficultyLevel.BEGINNER];
  const leniency = tier.gradingLeniency;
  const rawScore = Math.round(Math.min(similarity, 100));
  // phonemeFeedback is retained in TurnRecord for future pronunciation diagnostics.
  void phonemeFeedback;
  const score = pronunciationScore ?? Math.min(100, rawScore + Math.round(leniency * 0.3));

  const missedWords = turn ? findMissedWords(transcript, referenceText) : [];

  let coachingTip: string;
  if (score >= 85) {
    coachingTip = `Solid delivery. Keep it up.`;
  } else if (missedWords.length > 0) {
    const phrase = COACHING_PHRASES[Math.floor(Math.random() * COACHING_PHRASES.length)];
    coachingTip = `${phrase}: "${missedWords.slice(0, 3).join('", "')}"`;
  } else {
    coachingTip = score >= 60
      ? 'Watch your intonation and word endings.'
      : 'Try speaking more slowly and clearly.';
  }

  const [npcResponse, npcResponseTranslation] = getTurnReply(mission, state);

  return {
    pronunciation_score: score,
    accuracy_note: score >= 88 ? `Clean delivery (${tier.label} level)` : score >= 60 ? `Some inaccuracies (${tier.label} level)` : `Significant errors for ${tier.label} level`,
    suspicion_delta: score >= 85 ? -3 : score >= 60 ? 3 : 10,
    npc_response: npcResponse,
    npc_response_translation: npcResponseTranslation,
    coaching_tip: coachingTip,
    missed_words: missedWords,
  };
}
