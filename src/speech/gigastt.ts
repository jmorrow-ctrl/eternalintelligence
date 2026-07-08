import { getConfig } from '../config';

const GIGASTT_DEFAULT_URL = 'http://127.0.0.1:9876';

export async function speechToTextLocal(audioBuffer: Buffer): Promise<string> {
  const config = getConfig();
  const baseUrl = config.gigasttUrl || GIGASTT_DEFAULT_URL;

  const res = await fetch(`${baseUrl}/v1/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: new Uint8Array(audioBuffer),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`gigastt error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function checkGigasttHealth(): Promise<boolean> {
  const config = getConfig();
  const baseUrl = config.gigasttUrl || GIGASTT_DEFAULT_URL;
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
