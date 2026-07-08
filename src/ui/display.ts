import chalk from 'chalk';
import boxen from 'boxen';
import { Mission, TurnPrompt } from '../game/missions';
import { GameState, TurnRecord } from '../game/state';
import { GradeResult } from '../game/grader';
import { renderSuspicionBar } from './suspicion';

export function clearScreen(): void {
  console.clear();
}

export function renderHeader(state: GameState): void {
  const lastScore = state.history.length > 0 ? state.history[state.history.length - 1].score : '-';
  const lastDelta = state.history.length > 0 ? state.history[state.history.length - 1].delta : '-';
  const header = `Turn ${state.currentTurn}/${state.totalTurns} · Score: ${lastScore} · Δ: ${lastDelta}`;
  console.log(chalk.dim(header));
  console.log();
}

export function renderNpcLine(line: string, translation: string): void {
  console.log(
    boxen(chalk.white.bold(line), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'white',
      title: 'NPC',
    }),
  );
  console.log(chalk.dim(`  ${translation}`));
  console.log();
}

export function renderPromptCard(prompt: TurnPrompt): void {
  const lines = [
    chalk.cyan(prompt.ru),
    '',
    chalk.dim(prompt.phonetic),
    '',
    chalk.italic(prompt.en),
  ];
  const content = lines.join('\n');

  console.log(
    boxen(content, {
      padding: 1,
      borderStyle: 'single',
      borderColor: 'cyan',
      title: 'Say this',
    }),
  );
  console.log();
}

export function renderRecordingIndicator(active: boolean): void {
  if (active) {
    process.stdout.write(chalk.red.bold('\r ● REC ') + chalk.dim('[SPACE to stop]'));
  } else {
    process.stdout.write('\r                     \r');
  }
}

export function renderScoreCard(grade: GradeResult, transcript?: string, phonemeFeedback?: string): void {
  const scoreColor = grade.pronunciation_score >= 80
    ? chalk.green
    : grade.pronunciation_score >= 60
      ? chalk.yellow
      : chalk.red;

  const deltaStr = grade.suspicion_delta >= 0
    ? chalk.red(`+${grade.suspicion_delta}`)
    : chalk.green(String(grade.suspicion_delta));

  console.log();
  console.log(chalk.bold(' Results '));
  console.log(chalk.dim('─'.repeat(40)));
  if (transcript) {
    const isSilence = transcript === '(silence)';
    const borderColor = isSilence ? 'red' : 'green';
    const textStyle = isSilence ? chalk.red.bold : chalk.green;
    console.log(
      boxen(textStyle(transcript), {
        padding: 1,
        borderStyle: 'round',
        borderColor,
        title: isSilence ? 'Silence' : 'Heard',
      }),
    );
  }
  console.log(`Score:     ${scoreColor.bold(String(grade.pronunciation_score))}/100`);
  console.log(`Note:      ${chalk.dim(grade.accuracy_note)}`);
  console.log(`Suspicion: ${deltaStr}`);
  console.log(`Tip:       ${chalk.italic(grade.coaching_tip)}`);
  if (phonemeFeedback) {
    try {
      const words = JSON.parse(phonemeFeedback) as any[];
      const details = words.slice(0, 5).map((w: any) =>
        `${w.Word || '?'} ${w.AccuracyScore != null ? `(${Math.round(w.AccuracyScore)})` : ''}`
      ).join(', ');
      if (details) console.log(`Phonemes:  ${chalk.dim(details)}`);
    } catch {}
  }
  console.log(chalk.dim('─'.repeat(40)));

  console.log();
  console.log(
    boxen(chalk.white.bold(grade.npc_response), {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'white',
      title: 'NPC replies',
    }),
  );
  console.log(chalk.dim(`  ${grade.npc_response_translation}`));
  console.log();
}

export function renderMissionTitle(mission: Mission): void {
  console.log(
    boxen(chalk.yellow.bold(mission.title), {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'yellow',
      align: 'center',
    }),
  );
  console.log(chalk.dim(`  ${mission.setting}`));
  console.log();
}

export function renderGameOver(): void {
  const message = 'Suspicion level too high.\nYou have been compromised.';
  console.log(
    boxen(chalk.red.bold(' МИССИЯ ПРОВАЛЕНА \n') + chalk.red(message), {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'red',
      align: 'center',
    }),
  );
}

export function renderMissionComplete(): void {
  const message = 'All turns completed.\nCover maintained.';
  console.log(
    boxen(chalk.green.bold(' МИССИЯ ВЫПОЛНЕНА \n') + chalk.green(message), {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'green',
      align: 'center',
    }),
  );
}

export function renderTextModeIndicator(): void {
  console.log(chalk.bgYellow.black(' TEXT MODE '));
  console.log();
  console.log(chalk.yellow('Type responses in Russian. Speech recognition is disabled.'));
  console.log();
}

export function renderSpeakingIndicator(): void {
  console.log(chalk.green(' ▶ Speaking...  '));
  console.log();
}

interface WordResult {
  Word: string;
  AccuracyScore?: number;
  ErrorType?: string;
}

export function renderRecap(history: TurnRecord[]): void {
  const missed: { turn: number; word: string; score: number }[] = [];
  let totalWords = 0;
  let lowWords = 0;

  for (const record of history) {
    if (!record.phonemeFeedback) continue;
    try {
      const words: WordResult[] = JSON.parse(record.phonemeFeedback);
      for (const w of words) {
        totalWords++;
        if ((w.AccuracyScore ?? 100) < 70) {
          lowWords++;
          missed.push({ turn: record.turn, word: w.Word, score: Math.round(w.AccuracyScore ?? 0) });
        }
      }
    } catch {}
  }

  console.log();
  console.log(chalk.bold(' Performance Recap '));
  console.log(chalk.dim('─'.repeat(40)));

  if (totalWords === 0) {
    console.log(chalk.dim('No pronunciation data available.'));
    console.log(chalk.dim('Use speech mode with Azure STT to get word-level feedback.'));
    console.log(chalk.dim('─'.repeat(40)));
    console.log();
    return;
  }

  const pct = totalWords > 0 ? Math.round(((totalWords - lowWords) / totalWords) * 100) : 0;
  console.log(`Words assessed: ${totalWords}`);
  console.log(`Correct:        ${chalk.green(String(totalWords - lowWords))} | Needs work: ${chalk.yellow(String(lowWords))}`);
  console.log(`Word accuracy:  ${pct >= 70 ? chalk.green(String(pct) + '%') : chalk.yellow(String(pct) + '%')}`);
  console.log();

  if (missed.length > 0) {
    console.log(chalk.bold(' Words to review '));
    console.log(chalk.dim('─'.repeat(40)));
    for (const m of missed) {
      const barLen = Math.max(1, Math.round((m.score / 100) * 20));
      const bar = chalk.red('█'.repeat(barLen)) + chalk.dim('░'.repeat(Math.max(0, 20 - barLen)));
      const color = m.score < 30 ? chalk.red : m.score < 50 ? chalk.yellow : chalk.white;
      console.log(`T${m.turn} ${color(m.word.padEnd(18))} ${bar} ${m.score}`);
    }
    console.log(chalk.dim('─'.repeat(40)));
    console.log(chalk.dim('Tip: Focus on the words above. Replay easier missions to practice.'));
  }

  console.log();
}
