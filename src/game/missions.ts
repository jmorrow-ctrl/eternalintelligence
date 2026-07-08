export interface TurnPrompt {
  ru: string;
  phonetic: string;
  en: string;
}

export interface Turn {
  id: number;
  instruction?: string;
  prompt: TurnPrompt;
}

export interface NPCDef {
  name: string;
  personality: string;
  initialLine: string;
  initialTranslation: string;
}

export interface Mission {
  id: string;
  title: string;
  setting: string;
  npc: NPCDef;
  difficulty: string;
  debriefRu: string;
  debriefEn: string;
  turns: Turn[];
}
