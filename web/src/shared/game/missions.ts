export interface RubyToken {
  text: string;
  reading: string;
}

export interface TurnPrompt {
  ru: string;
  phonetic: string;
  en: string;
  native_script?: string;
  tokens?: RubyToken[];
}

export interface Turn {
  id: number;
  instruction?: string;
  prompt: TurnPrompt;
  answer?: string;
  npcReply?: {
    ru: string;
    en: string;
  };
}

export interface NPCDef {
  name: string;
  personality: string;
  initialLine: string;
  initialTranslation: string;
  npcNativeLine?: string;
}

export interface Mission {
  id: string;
  title: string;
  setting: string;
  npc: NPCDef;
  difficulty: string;
  language: string;
  debriefRu: string;
  debriefEn: string;
  turns: Turn[];
}
