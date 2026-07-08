import { execSync, spawn } from 'child_process';

function rawToWav(pcm: Buffer, sampleRate: number, bits: number, channels: number): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcm.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bits / 8, 28);
  header.writeUInt16LE(channels * bits / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function recordViaParec(): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const child = spawn('parec', [
      '--rate=16000', '--channels=1', '--format=s16le',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    child.stdout.on('data', (d: Buffer) => chunks.push(d));

    const stdin = process.stdin as any;
    const wasRaw = stdin.isRaw;
    try { stdin.setRawMode(true); } catch { /* ignore */ }
    stdin.resume();
    stdin.setEncoding('utf-8');
    stdin.ref();

    const onKey = (key: string) => {
      if (key === ' ') {
        stdin.removeListener('data', onKey);
        try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
        child.kill('SIGTERM');
      } else if (key === '\u0003') {
        process.exit(0);
      }
    };
    stdin.on('data', onKey);

    child.on('exit', () => {
      stdin.removeListener('data', onKey);
      try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
      const raw = Buffer.concat(chunks);
      resolve(rawToWav(raw, 16000, 16, 1));
    });

    child.on('error', () => resolve(null));
  });
}

export async function recordAudio(): Promise<Buffer | null> {
  try {
    execSync('which parec', { stdio: 'ignore' });
    return recordViaParec();
  } catch {}

  try {
    const recordModule = await import('node-record-lpcm16');
    const record = (recordModule as any).default || recordModule;

    for (const recorder of ['arecord', 'sox', 'rec', 'parec']) {
      try {
        execSync(`which ${recorder}`, { stdio: 'ignore' });

        return new Promise((resolve) => {
          const chunks: Buffer[] = [];
          const opts: Record<string, any> = {
            recorder,
            sampleRate: 16000,
            channels: 1,
            audioType: 'wav',
          };
          if (recorder === 'sox' || recorder === 'rec') {
            opts.silence = 2.0;
            opts.threshold = 0.5;
          }
          const recording = record.record(opts);

          const stdin = process.stdin as any;
          const wasRaw = stdin.isRaw;
          try { stdin.setRawMode(true); } catch { /* ignore */ }
          stdin.resume();
          stdin.setEncoding('utf-8');
          stdin.ref();

          const onKey = (key: string) => {
            if (key === ' ') {
              stdin.removeListener('data', onKey);
              try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
              recording.stop();
            } else if (key === '\u0003') {
              process.exit(0);
            }
          };
          stdin.on('data', onKey);

          recording.stream()
            .on('data', (chunk: Buffer) => chunks.push(chunk))
            .on('end', () => {
              stdin.removeListener('data', onKey);
              try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
              resolve(Buffer.concat(chunks));
            })
            .on('error', () => {
              stdin.removeListener('data', onKey);
              try { stdin.setRawMode(wasRaw ?? false); } catch { /* ignore */ }
              resolve(null);
            });
        });
      } catch {}
    }

    return null;
  } catch {
    return null;
  }
}
