import { readFileSync } from 'fs';
import { createInterface, Interface } from 'readline';
import chalk from 'chalk';
import { getConfig } from './config';
import { CURRICULUM, DifficultyLevel } from './curriculum';
import { Mission } from './game/missions';
import { GameState, computeDelta, clamp } from './game/state';
import { gradeTranscript } from './game/grader';
import { recordAudio } from './speech/recorder';
import { speechToTextLocal, checkGigasttHealth } from './speech/gigastt';
import { pronunciationAssessment } from './speech/pronunciation';
import { speak } from './speech/tts';
import {
  clearScreen,
  renderHeader,
  renderNpcLine,
  renderPromptCard,
  renderRecap,
  renderScoreCard,
  renderMissionTitle,
  renderGameOver,
  renderMissionComplete,
  renderSpeakingIndicator,
  renderTextModeIndicator,
  renderRecordingIndicator,
} from './ui/display';
import { renderSuspicionBar } from './ui/suspicion';

function createInputReader(): { getTextInput: () => Promise<string>; close: () => void } {
  const stdin = process.stdin as any;

  if (!stdin.isTTY) {
    const rl: Interface = createInterface({ input: process.stdin });
    const lines: string[] = [];

    rl.on('line', (line: string) => lines.push(line));

    return {
      async getTextInput(): Promise<string> {
        if (lines.length > 0) return lines.shift()!.trim();
        return '';
      },
      close() {
        rl.close();
      },
    };
  }

  const rl: Interface = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    async getTextInput(): Promise<string> {
      return new Promise<string>((resolve) => {
        rl.question(chalk.cyan('Введите ваш ответ на русском: '), (answer) => {
          resolve(answer.trim());
        });
      });
    },
    close() {
      rl.close();
    },
  };
}

const DIFFICULTY_MISSIONS: Record<string, string> = {
  beginner: 'missions/01-moscow-metro.json',
  intermediate: 'missions/02-university-visit.json',
  advanced: 'missions/03-grocery-market.json',
};

function parseArgs(): { noSpeech: boolean; noTts: boolean; missionPath: string; difficulty: DifficultyLevel } {
  const args = process.argv.slice(2);
  const noSpeech = args.includes('--no-speech');
  const noTts = args.includes('--no-tts');
  let difficulty = DifficultyLevel.BEGINNER;

  const diffEq = args.find(a => a.startsWith('--difficulty='));
  if (diffEq) {
    const val = diffEq.split('=')[1].toLowerCase();
    if (val in DifficultyLevel) {
      difficulty = val as DifficultyLevel;
    }
  } else {
    const idx = args.indexOf('--difficulty');
    if (idx !== -1 && idx + 1 < args.length) {
      const val = args[idx + 1].toLowerCase();
      if (val in DifficultyLevel) {
        difficulty = val as DifficultyLevel;
      }
    }
  }

  let missionPath = DIFFICULTY_MISSIONS[difficulty];

  const missionEq = args.find(a => a.startsWith('--mission='));
  if (missionEq) {
    missionPath = missionEq.split('=')[1];
  } else {
    const idx = args.indexOf('--mission');
    if (idx !== -1 && idx + 1 < args.length) {
      missionPath = args[idx + 1];
    }
  }

  return { noSpeech, noTts, missionPath, difficulty };
}

function loadMissionFromFile(path: string): Mission {
  const data = readFileSync(path, 'utf-8');
  return JSON.parse(data) as Mission;
}

function waitForSpace(): Promise<void> {
  return new Promise<void>((resolve) => {
    const stdin = process.stdin as any;

    if (!stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = stdin.isRaw;
    try { stdin.setRawMode(true); } catch { resolve(); return; }
    stdin.resume();
    stdin.setEncoding('utf-8');
    stdin.ref();

    const handler = (key: string) => {
      if (key === ' ') {
        stdin.removeListener('data', handler);
        try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
        resolve();
      } else if (key === '\u0003') {
        process.exit(0);
      }
    };

    stdin.on('data', handler);
  });
}

function waitForSpaceOrReplay(onPlay: () => void): Promise<void> {
  return new Promise<void>((resolve) => {
    const stdin = process.stdin as any;

    if (!stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = stdin.isRaw;
    try { stdin.setRawMode(true); } catch { resolve(); return; }
    stdin.resume();
    stdin.setEncoding('utf-8');
    stdin.ref();

    const handler = (key: string) => {
      if (key === ' ') {
        stdin.removeListener('data', handler);
        try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
        resolve();
      } else if (key === 'r' || key === 'R') {
        onPlay();
      } else if (key === '\u0003') {
        process.exit(0);
      }
    };

    stdin.on('data', handler);
  });
}

async function main(): Promise<void> {
  const { noSpeech, noTts, missionPath, difficulty } = parseArgs();
  getConfig();
  const mission = loadMissionFromFile(missionPath);
  const input = createInputReader();

  let state: GameState = {
    suspicion: 12,
    currentTurn: 0,
    totalTurns: mission.turns.length,
    history: [],
    npcLastLine: mission.npc.initialLine,
    npcLastTranslation: mission.npc.initialTranslation,
  };

  clearScreen();
  renderMissionTitle(mission);

  if (noSpeech) {
    renderTextModeIndicator();
  }

  const curriculumTier = CURRICULUM[difficulty];
  const briefing = `Your cover: foreign visitor.\nDifficulty: ${curriculumTier.label}\nScenario: ${curriculumTier.description}\nTarget: reach your contact without raising suspicion.\nNPC: ${mission.npc.name} (${mission.npc.personality})`;
  console.log(chalk.dim(briefing));
  console.log();

  const spaceHint = noTts ? 'Press SPACE to begin...' : 'Press SPACE to begin · R to hear NPC';
  console.log(chalk.dim(spaceHint));
  const playInitial = () => { renderSpeakingIndicator(); speak(state.npcLastLine).catch(() => {}); };
  if (!noTts) playInitial();
  await waitForSpaceOrReplay(playInitial);

  for (const turn of mission.turns) {
    state.currentTurn = turn.id;

    clearScreen();
    renderHeader(state);
    renderNpcLine(state.npcLastLine, state.npcLastTranslation);
    const playLine = () => {
      renderSpeakingIndicator();
      speak(state.npcLastLine).catch(() => {});
    };
    if (!noTts) playLine();
    renderPromptCard(turn.prompt);

    let transcript = '';
    let pronunciationScore: number | undefined;
    let phonemeFeedback: string | undefined;
    let usedAzure = false;

    if (noSpeech) {
      transcript = await input.getTextInput();
    } else {
      const gigasttOk = await checkGigasttHealth().catch(() => false);
      if (!gigasttOk) {
        console.log(chalk.yellow('Local STT server (gigastt) not running. Type instead.'));
        console.log(chalk.dim('  Start it with: bin/gigastt serve'));
        transcript = await input.getTextInput();
      } else {
        await waitForSpace();

        console.log(chalk.dim('Press SPACE to stop recording...'));
        renderRecordingIndicator(true);

        try {
          const audioBuffer = await recordAudio();
          renderRecordingIndicator(false);

          if (audioBuffer && audioBuffer.length > 0) {
            process.stdout.write(chalk.dim('\nProcessing speech...\n'));

            const [sttResult, pronResult] = await Promise.all([
              speechToTextLocal(audioBuffer).catch(() => ''),
              pronunciationAssessment(audioBuffer, turn.prompt.ru).catch(() => null),
            ]);

            transcript = sttResult;
            if (pronResult && pronResult.score > 0) {
              pronunciationScore = pronResult.score;
              phonemeFeedback = pronResult.phonemeFeedback;
              usedAzure = true;
            }
          } else {
            console.log(chalk.yellow('\nMic capture unavailable. Type instead:'));
            transcript = await input.getTextInput();
          }
        } catch {
          renderRecordingIndicator(false);
          console.log(chalk.yellow('\nRecording failed. Type instead:'));
          transcript = await input.getTextInput();
        }

        if (!transcript || transcript.length === 0) {
          console.log(chalk.yellow('No speech detected. Type instead:'));
          transcript = await input.getTextInput();
        }
      }
    }

    if (!transcript || transcript.length === 0) {
      transcript = '(silence)';
    }

    const grade = await gradeTranscript(transcript, mission, state, pronunciationScore, phonemeFeedback);

    const finalScore = usedAzure && pronunciationScore !== undefined
      ? pronunciationScore
      : grade.pronunciation_score;

    const delta = computeDelta(finalScore, state.suspicion);
    state.suspicion = clamp(state.suspicion + delta, 0, 100);

    state.history.push({
      turn: state.currentTurn,
      score: finalScore,
      delta,
      transcript,
      coachingTip: grade.coaching_tip,
      phonemeFeedback,
    });

    state.npcLastLine = grade.npc_response;
    state.npcLastTranslation = grade.npc_response_translation;

    renderScoreCard(grade, transcript, phonemeFeedback);
    console.log(renderSuspicionBar(state.suspicion));

    if (state.suspicion >= 95) {
      console.log();
      renderRecap(state.history);
      renderGameOver();
      input.close();
      return;
    }

    if (state.currentTurn < state.totalTurns) {
      console.log();
      const hint = noTts ? 'Press SPACE for next turn...' : 'Press SPACE for next turn · R to hear NPC';
      console.log(chalk.dim(hint));
      const playNextLine = () => {
        renderSpeakingIndicator();
        speak(state.npcLastLine).catch(() => {});
      };
      await waitForSpaceOrReplay(playNextLine);
    }
  }

  console.log();
  renderRecap(state.history);
  renderMissionComplete();
  input.close();
}

main().catch(console.error);
