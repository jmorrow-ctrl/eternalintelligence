import { useState, useCallback } from 'react';
import type { Mission } from '../shared/game/missions';
import type { GameState, DifficultyMode } from '../shared/game/state';
import { computeDelta, clamp } from '../shared/game/state';
import type { GradeResult } from '../shared/game/grader';
import { gradeTranscript } from '../shared/game/grader';

export type GamePhase =
  | 'menu'
  | 'debrief'
  | 'turn_start'
  | 'grading'
  | 'results'
  | 'recap'
  | 'game_over';

export function useGameLoop() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mission, setMission] = useState<Mission | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startMission = useCallback((m: Mission, difficulty: DifficultyMode = 'beginner') => {
    setMission(m);
    setState({
      suspicion: 12,
      currentTurn: 1,
      totalTurns: m.turns.length,
      history: [],
      npcLastLine: m.npc.initialLine,
      npcLastTranslation: m.npc.initialTranslation,
      difficulty,
    });
    setGrade(null);
    setPhase('debrief');
  }, []);

  const advanceTurn = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const nextTurn = prev.currentTurn + 1;
      return {
        ...prev,
        currentTurn: nextTurn,
      };
    });
    setGrade(null);
    setPhase('turn_start');
  }, []);

  const submitTranscript = useCallback(async (
    transcript: string,
    pronunciationScore?: number,
    phonemeFeedback?: string,
  ): Promise<number | undefined> => {
    if (!mission || !state) return;
    setPhase('grading');

    await new Promise((r) => setTimeout(r, 400));

    const result = gradeTranscript(transcript, mission, state, pronunciationScore, phonemeFeedback);
    const delta = computeDelta(result.pronunciation_score, state.suspicion);
    const newSuspicion = clamp(state.suspicion + delta, 0, 100);

    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suspicion: newSuspicion,
        history: [...prev.history, {
          turn: prev.currentTurn,
          score: result.pronunciation_score,
          delta,
          transcript,
          coachingTip: result.coaching_tip,
          phonemeFeedback,
        }],
        npcLastLine: result.npc_response,
        npcLastTranslation: result.npc_response_translation,
      };
    });
    setGrade(result);
    setPhase(newSuspicion >= 95 ? 'game_over' : 'results');
    return delta;
  }, [mission, state]);

  const beginMission = useCallback(() => {
    setPhase('turn_start');
  }, []);

  const showRecap = useCallback(() => {
    setPhase('recap');
  }, []);

  const backToMenu = useCallback(() => {
    setMission(null);
    setState(null);
    setGrade(null);
    setIsSpeaking(false);
    setPhase('menu');
  }, []);

  return {
    phase, mission, state, grade, isSpeaking,
    setIsSpeaking,
    startMission, beginMission, advanceTurn, submitTranscript, showRecap, backToMenu,
  };
}
