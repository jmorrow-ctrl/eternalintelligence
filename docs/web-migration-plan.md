# Web Migration Plan

## Goal
Port the CLI covert-ops-ru game to a browser-based web UI so users need zero setup — just open a URL.

## Stack

```
Frontend: Vite + vanilla TypeScript (no framework lock-in)
Optional: React if you want component ecosystem later

Backend: None required for v1. Optional thin API server later.
```

## Directory structure

```
covert-ops-ru/
├── src/                    # Shared TS (game logic, data, types)
│   ├── game/               #   → moves as-is, 0 changes
│   ├── curriculum.ts       #   → moves as-is
│   └── speech/             #   → DELETE (replaced by browser APIs)
│
├── missions/               #   → moves as-is (static JSON)
│
├── web/                    # NEW: web frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.ts         #   entry, game loop
│   │   ├── components/     #   UI components
│   │   │   ├── MissionTitle.ts
│   │   │   ├── NpcDialog.ts
│   │   │   ├── TurnPrompt.ts
│   │   │   ├── ScoreCard.ts
│   │   │   ├── SuspicionBar.ts
│   │   │   ├── Recorder.ts
│   │   │   └── Recap.ts
│   │   ├── speech/         #   browser speech wrappers
│   │   │   ├── stt.ts      #   Web Speech API (SpeechRecognition)
│   │   │   ├── tts.ts      #   SpeechSynthesisUtterance
│   │   │   └── recorder.ts #   getUserMedia + MediaRecorder
│   │   └── styles.css
│   └── public/
│
└── docs/web-migration-plan.md
```

## Migration steps

### Phase 1 — Shared game logic (copy, no changes)

| File | Action |
|---|---|
| `src/game/missions.ts` | Copy to shared lib |
| `src/game/state.ts` | Copy to shared lib |
| `src/game/grader.ts` | Copy to shared lib (mock grader is client-safe) |
| `src/curriculum.ts` | Copy to shared lib |
| `missions/*.json` | Copy as static assets |

### Phase 2 — Rewrite speech layer (replace CLI-specific code)

**Current (CLI)** → **Web (browser built-in)**

| Component | CLI | Web |
|---|---|---|
| **STT** | `gigastt` (local server) | `SpeechRecognition` — no server needed |
| **TTS** | `edge-tts` (Python) | `speechSynthesis.speak()` — no install |
| **Mic** | `parec` (PulseAudio) | `navigator.mediaDevices.getUserMedia()` |

`src/speech/` is deleted entirely. New `web/src/speech/` replaces it.

### Phase 3 — Build UI components

Each CLI `render*` function becomes a component that renders HTML instead of `console.log`:

| CLI function | Web component |
|---|---|
| `renderMissionTitle` | `<div class="mission-title">` |
| `renderNpcLine` | `<div class="npc-dialog"><p>text</p><button>🔁 Replay</button></div>` |
| `renderPromptCard` | `<div class="prompt-card">` |
| `renderScoreCard` | `<div class="score-card">` |
| `renderSuspicionBar` | `<div class="suspicion-bar">` (CSS gradient bar) |
| `renderRecap` | `<div class="recap">` |
| `renderSpeakingIndicator` | Animated CSS pulse on the NPC dialog border |

### Phase 4 — Game loop becomes event-driven

CLI is linear `for` loop with `await`:
```
for turn in turns:
  render NPC line
  await speech/text input
  grade
  render score card
  await space for next
```

Web is state-machine driven:
```
State: TURN_START | RECORDING | PROCESSING | SCORE | GAME_OVER
```

- `TURN_START`: show NPC line + prompt, auto-play TTS
- `RECORDING`: user taps mic button, `MediaRecorder` captures
- `PROCESSING`: STT + grading
- `SCORE`: show score card, "Next Turn" button
- State transitions driven by user clicks + async callbacks

### Phase 5 — Optional backend (for Claude + Azure)

Only if you want real AI grading and pronunciation assessment.

```
covert-ops-ru/
├── api/                    # Optional backend
│   ├── package.json
│   ├── src/
│   │   ├── grade.ts        #   POST /api/grade → Claude
│   │   ├── pronounce.ts    #   POST /api/pronounce → Azure
│   │   └── server.ts       #   Express or Hono
│   └── .env.example
```

Frontend calls these endpoints via `fetch()`. Without the backend, the client-side mock grader handles everything — same as the current CLI behavior.

## What the user experience looks like (v1)

1. Open `https://covert-ops.example.com`
2. Choose difficulty → begin mission
3. NPC dialog box appears with Russian text + "🔊" button that replays TTS
4. Tap mic button → browser asks for mic permission → speaks response
5. Browser STT transcribes → local mock grader evaluates
6. Score card + suspense bar update
7. Next button → repeat until mission complete or suspicion blows
8. Recap screen shows mispronounced words (if Azure enabled)

## What changes for you (the dev)

- Delete `src/speech/` (CLI-specific mic/STT/TTS)
- Keep `src/game/`, `src/curriculum.ts`, `missions/` untouched
- Write `web/` frontend
- Optional: decide whether to add a backend later

## Urgency

Phase 1 (shared logic copy) and Phase 3 (UI components) can happen in parallel. Phase 2 (browser speech) is the only rewrite.
