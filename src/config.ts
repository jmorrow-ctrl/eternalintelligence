import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  anthropicApiKey: string;
  azureSpeechKey: string;
  azureSpeechRegion: string;
  gigasttUrl: string;
}

let warned = false;

export function getConfig(): AppConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  const azureSpeechKey = process.env.AZURE_SPEECH_KEY || '';
  const azureSpeechRegion = process.env.AZURE_SPEECH_REGION || '';
  const gigasttUrl = process.env.GIGASTT_URL || 'http://127.0.0.1:9876';

  if (!warned) {
    if (!anthropicApiKey) {
      console.warn('Warning: ANTHROPIC_API_KEY not set. Grader will use mock responses.');
    }
    if (!azureSpeechKey || !azureSpeechRegion) {
      console.warn('Warning: Azure Speech credentials not set. Pronunciation assessment unavailable.');
    }
    warned = true;
  }

  return { anthropicApiKey, azureSpeechKey, azureSpeechRegion, gigasttUrl };
}
