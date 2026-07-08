export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  script: 'latin' | 'cyrillic' | 'hanzi' | 'kana' | 'kanji_kana';
  ttsVoice: string;
  sttLocale: string;
  requiresRuby: boolean;
  missionThemes: {
    beginner: { title: string; setting: string };
    intermediate: { title: string; setting: string };
    advanced: { title: string; setting: string };
  };
}

export const LANGUAGES: LanguageConfig[] = [
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    script: 'cyrillic',
    ttsVoice: 'ru-RU-DariyaNeural',
    sttLocale: 'ru-RU',
    requiresRuby: false,
    missionThemes: {
      beginner: { title: 'Линия 1 — Сокольническая', setting: 'Moscow metro, Okhotny Ryad. 08:40. Packed car. Ask a tired commuter for directions.' },
      intermediate: { title: 'МГУ — Ломоносовский корпус', setting: 'Moscow State University, main building. 10:15. You are a foreign student looking for the Department of Linguistics.' },
      advanced: { title: 'Продуктовый рынок', setting: 'Danilovsky market, Moscow. Saturday noon. You are hosting a dinner party tonight and need to buy ingredients.' },
    },
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇲🇽',
    script: 'latin',
    ttsVoice: 'es-MX-DaliaNeural',
    sttLocale: 'es-MX',
    requiresRuby: false,
    missionThemes: {
      beginner: { title: 'Mercado de la Ciudad', setting: 'A bustling market in Mexico City. 10:00 AM. You need to buy fresh produce and practice your Spanish with local vendors.' },
      intermediate: { title: 'Plaza Garibaldi', setting: 'Plaza Garibaldi, Mexico City. Evening. Mariachi bands play as you meet a friend at a street-side taquería.' },
      advanced: { title: 'Oficina de la Ciudad', setting: 'A government office in Mexico City. 2:30 PM. You need to resolve a paperwork issue and negotiate with a helpful but firm clerk.' },
    },
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    script: 'latin',
    ttsVoice: 'fr-FR-DeniseNeural',
    sttLocale: 'fr-FR',
    requiresRuby: false,
    missionThemes: {
      beginner: { title: 'Café du Marché', setting: 'A cozy café in Le Marais, Paris. 09:00. You order a croissant and coffee while chatting with the friendly barista.' },
      intermediate: { title: 'Métro Bastille', setting: 'Bastille metro station, Paris. Rush hour. You ask a local for directions to the Musée d\'Orsay.' },
      advanced: { title: 'Boulangerie de la Rue', setting: 'A traditional boulangerie in Montmartre. Saturday morning. You need to buy bread and pastries for a dinner party, negotiating quantities and asking for recommendations.' },
    },
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    script: 'latin',
    ttsVoice: 'de-DE-KatjaNeural',
    sttLocale: 'de-DE',
    requiresRuby: false,
    missionThemes: {
      beginner: { title: 'U-Bahn Alexanderplatz', setting: 'Alexanderplatz U-Bahn station, Berlin. 09:30. You are a tourist trying to find your way to the Brandenburg Gate.' },
      intermediate: { title: 'Restaurant Zur Haxe', setting: 'A traditional Berlin restaurant. 19:00. You meet a colleague for dinner and need to order in German.' },
      advanced: { title: 'Museum für Naturkunde', setting: 'The Museum of Natural History, Berlin. 14:00. You strike up a conversation with a fellow visitor about the exhibits.' },
    },
  },
  {
    code: 'is',
    name: 'Icelandic',
    nativeName: 'Íslenska',
    flag: '🇮🇸',
    script: 'latin',
    ttsVoice: 'is-IS-GudrunNeural',
    sttLocale: 'is-IS',
    requiresRuby: false,
    missionThemes: {
      beginner: { title: 'BSÍ Bus Terminal', setting: 'The main bus terminal in Reykjavík. 08:45. You need to ask about bus routes to the Golden Circle.' },
      intermediate: { title: 'Café Loki', setting: 'A small café near Hallgrímskirkja, Reykjavík. 11:30. You order traditional Icelandic food and chat with the server.' },
      advanced: { title: 'Ferðaskrifstofa', setting: 'A travel agency in downtown Reykjavík. 15:00. You need to arrange a multi-day tour of the Westfjords and discuss options.' },
    },
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    script: 'kanji_kana',
    ttsVoice: 'ja-JP-NanamiNeural',
    sttLocale: 'ja-JP',
    requiresRuby: true,
    missionThemes: {
      beginner: { title: '東京駅', setting: 'Tokyo Station. 09:00. You are a tourist trying to find the right platform for the Shinkansen to Kyoto.' },
      intermediate: { title: '居酒屋 天狗', setting: 'An izakaya (Japanese pub) in Shinjuku, Tokyo. 19:30. You go out drinking with new colleagues and need to order food and make small talk.' },
      advanced: { title: 'コンビニ', setting: 'A convenience store in Shibuya, Tokyo. Late night. You need to buy several items and chat with the friendly clerk about your evening plans.' },
    },
  },
  {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '普通话',
    flag: '🇨🇳',
    script: 'hanzi',
    ttsVoice: 'zh-CN-XiaoxiaoNeural',
    sttLocale: 'zh-CN',
    requiresRuby: true,
    missionThemes: {
      beginner: { title: '北京胡同', setting: 'A narrow hutong alley in Beijing. 10:00. You are lost and need to ask a friendly local for directions to the nearest subway station.' },
      intermediate: { title: '茶馆', setting: 'A traditional tea house near Tiananmen Square. 14:30. You meet a new Chinese friend for tea and conversation.' },
      advanced: { title: '火车站', setting: 'Beijing West Railway Station. 11:00. You need to buy a train ticket to Shanghai and negotiate with the ticket clerk.' },
    },
  },
];

export function getLanguage(code: string): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
