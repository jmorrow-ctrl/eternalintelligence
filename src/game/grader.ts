import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config';
import { CURRICULUM, DifficultyLevel } from '../curriculum';
import { Mission } from './missions';
import { GameState } from './state';

export interface GradeResult {
  pronunciation_score: number;
  accuracy_note: string;
  suspicion_delta: number;
  npc_response: string;
  npc_response_translation: string;
  coaching_tip: string;
}

function buildCurriculumContext(difficulty: DifficultyLevel): string {
  const tier = CURRICULUM[difficulty];
  const vocabList = tier.vocabulary.join(', ');
  const grammarList = tier.grammarTopics.join('\n- ');
  const skillList = tier.expectedSkills.join('\n- ');

  return `## Player's Curriculum Level: ${tier.label}

### Vocabulary the player should know:
${vocabList}

### Grammar topics studied:
- ${grammarList}

### Skills expected at this level:
- ${skillList}

### Grading Guidance for this level:
- BEGINNER: Be generous with minor errors. The player is learning basic phrases. Focus on whether the core meaning is communicated. Reward attempts to form complete sentences. Leniency offset: +15 points.
- INTERMEDIATE: Expect correct conjugation and basic case usage. Minor case ending mistakes are acceptable if meaning is clear. Leniency offset: +8 points.
- ADVANCED: Hold to a native-like standard. Expect correct aspect, case, and natural intonation. No leniency offset.

Current difficulty: ${difficulty.toUpperCase()}`;
}

export async function gradeTranscript(
  transcript: string,
  mission: Mission,
  state: GameState,
  pronunciationScore?: number,
  phonemeFeedback?: string,
): Promise<GradeResult> {
  const { anthropicApiKey } = getConfig();

  if (!anthropicApiKey) {
    return getMockGrade(transcript, mission, state);
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const turn = mission.turns[state.currentTurn - 1];
  const referenceRu = turn?.prompt?.ru || '';
  const curriculumContext = buildCurriculumContext(mission.difficulty as DifficultyLevel);

  const systemPrompt = `You are the grading engine for a Russian covert ops language game.
Mission context: ${mission.setting}
NPC personality: ${mission.npc.personality}
Current suspicion: ${state.suspicion}%
Difficulty level: ${mission.difficulty}
Reference phrase: "${referenceRu}"
Player transcript: "${transcript}"
${pronunciationScore !== undefined ? `Pronunciation accuracy: ${pronunciationScore}/100` : ''}
${phonemeFeedback ? `Phoneme feedback: ${phonemeFeedback}` : ''}

${curriculumContext}

Respond ONLY in valid JSON:
{
  "pronunciation_score": 0-100,
  "accuracy_note": "one sentence on main issue, or 'Clean delivery' if >=88.",
  "suspicion_delta": -8 to +18 integer,
  "npc_response": "NPC next line in Russian only, tone reflects suspicion + personality + difficulty level",
  "npc_response_translation": "(English translation)",
  "coaching_tip": "one concrete tip on what to improve (mistaken words, intonation, pronunciation). Max 25 words."
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Grade this response.' }],
    });

    const content = msg.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text) as GradeResult;
      return parsed;
    }
  } catch {
    // fall through to mock
  }

  return getMockGrade(transcript, mission, state);
}

function normalize(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^а-яёa-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function wordSimilarity(transcript: string, reference: string): number {
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

function getMockGrade(transcript: string, mission: Mission, state: GameState): GradeResult {
  const turn = mission.turns[state.currentTurn - 1];
  const similarity = turn ? wordSimilarity(transcript, turn.prompt.ru) : 50;
  const tier = CURRICULUM[mission.difficulty as DifficultyLevel] || CURRICULUM[DifficultyLevel.BEGINNER];
  const leniency = tier.gradingLeniency;
  const rawScore = Math.round(Math.min(similarity, 100));
  const score = Math.min(100, rawScore + Math.round(leniency * 0.3));

  const npcReplies: Record<string, [string, string]> = {
    1: ['Налево, потом прямо. Увидите.', '(Left, then straight. You will see it.)'],
    2: ['Выход к театру — налево.', '(The exit to the theatre is on the left.)'],
    3: ['А, турист! Добро пожаловать.', '(Ah, a tourist! Welcome.)'],
    4: ['Пожалуйста. Удачи вам.', '(You are welcome. Good luck to you.)'],
    5: ['И вам хорошего дня!', '(Have a nice day too!)'],
  };
  const reply = npcReplies[state.currentTurn] || ['Понятно.', '(I see.)'];

  function findMissedWords(transcript: string, reference: string): string[] {
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

  const missedWords = turn ? findMissedWords(transcript, turn.prompt.ru) : [];

  return {
    pronunciation_score: score,
    accuracy_note: score >= 88 ? `Clean delivery (${tier.label} level)` : score >= 60 ? `Some inaccuracies (${tier.label} level)` : `Significant errors for ${tier.label} level`,
    suspicion_delta: score >= 85 ? -3 : score >= 60 ? 3 : 10,
    npc_response: reply[0],
    npc_response_translation: reply[1],
    coaching_tip: score >= 85
      ? `Good form at ${tier.label} level. Keep it up.`
      : score >= 60 && missedWords.length > 0
        ? `Watch your pronunciation of: "${missedWords.slice(0, 3).join('", "')}"`
        : score >= 60
          ? 'Focus on intonation and clarity.'
          : missedWords.length > 0
            ? `Practice saying: "${missedWords.slice(0, 3).join('", "')}"`
            : 'Try speaking more slowly, separating each word.',
  };
}
