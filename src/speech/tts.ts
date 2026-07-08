import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const EDGE_TTS = '/tmp/edge-tts-venv/bin/edge-tts';
const RUSSIAN_VOICE = 'ru-RU-SvetlanaNeural';

let available: boolean | null = null;

export function isTtsAvailable(): boolean {
  if (available !== null) return available;
  try {
    execSync(`${EDGE_TTS} --list-voices 2>/dev/null | grep -q ${RUSSIAN_VOICE}`, { stdio: 'ignore' });
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!isTtsAvailable()) {
      resolve();
      return;
    }

    const tmpFile = path.join(os.tmpdir(), `tts-${Date.now()}.wav`);

    const tts = spawn(EDGE_TTS, ['--voice', RUSSIAN_VOICE, '--text', text, '--write-media', tmpFile], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let err = '';
    tts.stderr.on('data', (d) => { err += d; });

    tts.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(tmpFile) || fs.statSync(tmpFile).size === 0) {
        resolve();
        return;
      }

      const player = spawn('paplay', [tmpFile], { stdio: 'ignore' });
      player.on('close', () => {
        try { fs.unlinkSync(tmpFile); } catch {}
        resolve();
      });
      player.on('error', () => {
        try { fs.unlinkSync(tmpFile); } catch {}
        resolve();
      });
    });

    tts.on('error', () => resolve());
  });
}
