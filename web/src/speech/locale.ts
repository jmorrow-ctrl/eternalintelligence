import { LANGUAGES } from '../languages/config';

export function getLanguageName(languageCode: string): string {
  return LANGUAGES.find((l) => l.code === languageCode)?.name ?? 'Russian';
}

export function getLanguageSttLocale(languageCode: string): string {
  return LANGUAGES.find((l) => l.code === languageCode)?.sttLocale ?? 'ru-RU';
}

export function getLanguageTtsLocale(languageCode: string): string {
  return LANGUAGES.find((l) => l.code === languageCode)?.sttLocale ?? 'ru-RU';
}
