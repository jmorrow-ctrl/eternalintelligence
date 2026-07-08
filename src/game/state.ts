export type SuspicionState = 'at_ease' | 'neutral' | 'wary' | 'suspicious' | 'blown';

export interface TurnRecord {
  turn: number;
  score: number;
  delta: number;
  transcript: string;
  coachingTip: string;
  phonemeFeedback?: string;
}

export interface GameState {
  suspicion: number;
  currentTurn: number;
  totalTurns: number;
  history: TurnRecord[];
  npcLastLine: string;
  npcLastTranslation: string;
}

export function getSuspicionState(s: number): SuspicionState {
  if (s < 20) return 'at_ease';
  if (s < 40) return 'neutral';
  if (s < 60) return 'wary';
  if (s < 80) return 'suspicious';
  return 'blown';
}

export function computeDelta(pronScore: number, currentSuspicion: number): number {
  if (pronScore >= 85) {
    if (currentSuspicion <= 20) return -5;
    if (currentSuspicion <= 50) return -3;
    return -2;
  } else if (pronScore >= 60) {
    return 3;
  } else {
    const base = 8;
    const amp = currentSuspicion >= 60 ? 2 : 1;
    return base * amp;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
