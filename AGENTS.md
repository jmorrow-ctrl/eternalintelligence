# Agent Guidance for Covert Ops / Polyglot

## Dialogue Structure Rules

The game is a voice-first language-learning spy simulator. Every mission is a scripted conversation between an NPC and the player. Getting the order right is critical.

### Core Flow

1. **Mission starts** → NPC speaks `npc.initialLine` (with translation).
2. **"YOUR LINE" appears** → Player sees the target-language prompt for `turns[0]`.
3. **Player speaks (or types)** their line.
4. **Grading phase** → The grader compares the transcript to the prompt.
5. **Results phase** → The grader's `npcReply` for that turn is shown/s spoken as the NPC's response.
6. **Player clicks NEXT TURN**.
7. **Next turn starts** → The NPC line from step 5 is shown again at the top, then "YOUR LINE" reveals `turns[1]`.
8. Repeat for each turn.

### Golden Rules

- **The `npcReply` is the NPC's response to the player's line.** It must make sense as a reply.
- **Never use the player's next prompt as the NPC line.** The `advanceTurn` function must only update `currentTurn`, not `npcLastLine`.
- **The NPC line at the start of a turn is always the reply from the previous turn** (or `npc.initialLine` for turn 1).
- **The `YOUR LINE` prompt must never echo the NPC line verbatim.** It should advance the conversation naturally.
- **Every turn should feel like a real exchange**, not a disconnected textbook exercise.

### JSON Schema

Mission files live in `web/public/missions/<lang>/<id>.json`.

```json
{
  "id": "market",
  "title": "Mercado de San Telmo",
  "language": "es",
  "setting": "...",
  "npc": {
    "name": "Señora Lupe",
    "personality": "...",
    "initialLine": "NPC's opening line in target language",
    "initialTranslation": "English translation"
  },
  "difficulty": "any",
  "debriefRu": "Briefing in target language",
  "debriefEn": "Briefing in English",
  "turns": [
    {
      "id": 1,
      "instruction": "What the player should do / say.",
      "prompt": {
        "ru": "Target-language line the player must say",
        "phonetic": "Pronunciation guide",
        "en": "English meaning"
      },
      "npcReply": {
        "ru": "NPC's response after the player says the prompt",
        "en": "English translation of the reply"
      }
    }
  ]
}
```

The `npcReply` field is optional but strongly preferred. If omitted, a generic language-aware fallback is used.

### Anti-Patterns

- NPC: `¿Qué se le ofrece?` → Player: `¿Qué se le ofrece?` ❌ (verbatim echo)
- NPC: `Buenos días.` → Player: `Buenos días.` ⚠️ (greeting echo — acceptable only in highly formal contexts)
- Player asks for directions → NPC replies "You're welcome" ❌ (reply doesn't match)
- `advanceTurn` overwrites `npcLastLine` with the next player prompt ❌ (this was the source of the "out of order" bug)

### Regional Consistency

- Spanish missions are set in **Buenos Aires, Argentina** and use **Rioplatense Spanish**.
- The curriculum in `web/src/languages/curriculum/spanish.ts` reflects Argentine vocabulary and voseo.

## UI / Globe Rules

- Country selection uses a D3 orthographic globe with capital-city pins.
- Selecting a city should orient that city to the center of the globe and stop idle auto-rotation.
- Idle auto-rotation resumes after a short delay only when the user is not interacting.

## Build & Run

- `npm run lint` and `npm run build` must pass before restarting the dev server.
- Restart dev server with: `npx vite --host 127.0.0.1 --port 5173` for local mic access.
