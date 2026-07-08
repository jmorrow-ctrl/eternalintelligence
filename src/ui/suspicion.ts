import chalk from 'chalk';
import { getSuspicionState, SuspicionState } from '../game/state';

export function renderSuspicionBar(suspicion: number): string {
  const width = 30;
  const filled = Math.round((suspicion / 100) * width);
  let bar = '';
  for (let i = 0; i < width; i++) {
    if (i < filled) {
      const ratio = i / width;
      if (ratio < 0.33) bar += chalk.green('█');
      else if (ratio < 0.66) bar += chalk.yellow('█');
      else bar += chalk.red('█');
    } else {
      bar += chalk.dim('░');
    }
  }

  const state: SuspicionState = getSuspicionState(suspicion);
  const stateLabel = state.replace(/_/g, ' ');
  const labelColor = suspicion < 40 ? chalk.green : suspicion < 60 ? chalk.yellow : chalk.red;

  return `${bar} ${chalk.bold(String(suspicion))}/100 ${labelColor(`[${stateLabel}]`)}`;
}
