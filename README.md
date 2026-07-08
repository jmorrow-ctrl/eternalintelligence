# Eternal Intelligence

A voice-first language-learning spy simulator. Pick a mission anywhere on the globe, then talk your way through scripted encounters in the target language.

## What it is

Eternal Intelligence trains you to handle real-world conversations under pressure. Each mission drops you into a scripted scene — a Moscow metro station, a Buenos Aires market, a Tokyo hotel, a Shanghai train station — and plays out as a back-and-forth dialogue with an NPC. You speak (or type) your line, the game grades it against the mission prompt, and the NPC replies with the next line of the scene.

## Quick start

### Web app

```bash
cd web
npm install
npm run build
npx vite --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/` in a browser. Microphone access only works on `127.0.0.1` in non-HTTPS local dev.

### CLI version

```bash
npm install
npm run dev
```

Run a specific difficulty or mission:

```bash
npm run beginner
npm run intermediate
npm run advanced
npm run mission
```

## Project layout

```
web/                    # React + Vite web app
  src/
    components/         # Globe selector, HUD, speech UI
    shared/game/        # Mission loader, grader, curriculum
    languages/          # Per-language curriculum configs
    hooks/              # Game loop and turn management
  public/missions/      # JSON mission files by language
src/                    # Original TypeScript CLI app
missions/               # Original CLI mission files
bin/                    # Speech helpers and native capture scripts
AGENTS.md               # Contributor guidance for agents
```

## Supported languages

- **Russian** — Moscow metro, university visit, grocery market
- **Japanese** — Tokyo hotel check-in, university visit
- **Mandarin** — Shanghai train station
- **Spanish** — Buenos Aires / Rioplatense Spanish

More languages and missions can be added by dropping new JSON missions into `web/public/missions/<lang>/` and registering them in `web/src/shared/game/missions.ts`.

## Mission file format

```json
{
  "id": "market",
  "title": "Mercado de San Telmo",
  "language": "es",
  "setting": "...",
  "npc": {
    "name": "Señora Lupe",
    "personality": "...",
    "initialLine": "NPC opening line",
    "initialTranslation": "English translation"
  },
  "difficulty": "any",
  "debriefRu": "Briefing in target language",
  "debriefEn": "Briefing in English",
  "turns": [
    {
      "id": 1,
      "instruction": "What the player should do / say",
      "prompt": {
        "ru": "Target-language line",
        "phonetic": "Pronunciation guide",
        "en": "English meaning"
      },
      "npcReply": {
        "ru": "NPC response to the player's line",
        "en": "English translation"
      }
    }
  ]
}
```

## Difficulty levels

- **Beginner** — Shows the target-language line, phonetic guide, and English meaning. Provides translation feedback after each attempt.
- **Intermediate** — Shows the target-language line and phonetic guide.
- **Advanced** — Hides the target-language line; you respond to the NPC based on context and the English instruction only.

## Development

The web app uses:

- React 19
- Vite 8
- D3 orthographic globe with `topojson-client`
- Web Speech API for microphone input

Before restarting the dev server, make sure the project builds cleanly:

```bash
cd web
npm run lint
npm run build
```

If port `5173` is busy, kill any stale Vite processes and restart.

## License

MIT
