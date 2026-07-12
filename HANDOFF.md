# Handoff: Eternal Intelligence

## Project Goal

Eternal Intelligence is a **voice-first language-learning spy simulator**. The player picks a country/mission on a 3D globe and then talks their way through scripted NPC encounters in the target language (Russian, Japanese, Mandarin, Spanish, German, French, Icelandic). Each mission is a back-and-forth dialogue: the NPC speaks, the player sees a "YOUR LINE" prompt, speaks (or types) their line, the game grades it, and the NPC replies. The loop repeats until the mission is complete.

The core experience is built around:
- **Globe-based country/mission selection** (D3 orthographic globe with city dots)
- **Per-turn grading** against target-language prompts
- **Context-aware NPC replies** defined per turn
- **Beginner / Intermediate / Advanced** difficulty progression
- **Web Speech API** for microphone input in the browser
- **Black, terminal-style UI** for mission/debrief/recap/completion screens

## Current State (as of this session)

### Completed
- D3 orthographic globe with smooth spin-to-city animation, idle rotation that pauses while a city is selected, and city dots instead of protruding pins.
- Per-turn `npcReply` field added to mission schema; grader uses these instead of generic fallback responses.
- Dialogue-order bug fixed: `advanceTurn` no longer overwrites `npcLastLine` with the next player prompt.
- NaN/longitude normalization guards added to prevent SVG path collapse during globe rotation.
- Black backgrounds applied to mission selection, debrief, recap, completion, and terminal-mode screens.
- Spanish missions moved to Buenos Aires/Argentina with Rioplatense Spanish (voseo, local vocabulary).
- Spanish curriculum updated from Mexican Spanish to Argentine/Rioplatense Spanish.
- Japanese and Chinese missions audited for advanced-mode clarity and naturalness.
- Ruby toggle hidden in advanced difficulty (no target-language prompt shown).
- Beginner difficulty now shows translation feedback after the player submits a line.
- `AGENTS.md` created with dialogue structure rules and build conventions.
- `README.md` created.
- Git repo initialized inside `/mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru/`.
- `.gitignore` created to exclude `node_modules`, `dist`, `.env`, and editor/OS files.
- Initial commit created locally with 103 files.
- Remote `origin` set to `git@github.com:jmorrow-ctrl/eternalintelligence.git`.

### Blocked
- **Push to GitHub is blocked because there is no SSH key configured in this environment.**
  - `~/.ssh/` does not exist.
  - `ssh -T git@github.com` returns `Host key verification failed.`
  - The commit is ready to push; only authentication is missing.

### Known Issues / Watch List
- Stale Vite processes can hold port `5173`; kill them before restarting dev server.
- The old root repo at `/mnt/c/ANUBISNETHERREALM/` is a different project (bible-verse app) — do not commit from there.
- The Icelandic `.epub` file was removed from the staged commit but may still exist in `web/`; it should not be committed.

## Next Steps for a New Session

1. **Set up SSH for GitHub push**
   - Generate a new SSH key:
     ```bash
     ssh-keygen -t ed25519 -C "jmorrow@example.com" -f ~/.ssh/id_ed25519_eternalintelligence
     ```
   - Add the public key (`~/.ssh/id_ed25519_eternalintelligence.pub`) to GitHub at https://github.com/settings/keys
   - Start ssh-agent and load the key:
     ```bash
     eval "$(ssh-agent -s)"
     ssh-add ~/.ssh/id_ed25519_eternalintelligence
     ```
   - Test connectivity:
     ```bash
     ssh -T git@github.com
     ```
   - Push:
     ```bash
     git push -u origin main
     ```

2. **After push, verify GitHub repo**
   - Check that `README.md`, `AGENTS.md`, and all source files are visible.
   - Confirm `.gitignore` is working (no `node_modules` or `dist` in the remote view).

3. **Continue feature work if desired**
   - Add more missions or languages.
   - Improve grader robustness (fuzzy matching, pronunciation scoring).
   - Add sound effects, voice synthesis, or animated transitions.
   - Add tests for the grader and game loop.
   - Deploy the built `web/dist/` to a static host.

## Key Commands

```bash
# Dev server (must use 127.0.0.1:5173 for mic access)
cd /mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru/web
npm run lint
npm run build
npx vite --host 127.0.0.1 --port 5173

# CLI version
cd /mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru
npm run dev

# Git
cd /mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru
git status
git log --oneline -5
git remote -v
```

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup, mission format |
| `AGENTS.md` | Agent/contributor rules (dialogue flow, schema, conventions) |
| `web/src/components/GlobeCountrySelector.tsx` | D3 globe, city dots, rotation, idle spin |
| `web/src/shared/game/grader.ts` | Grading logic and NPC reply selection |
| `web/src/shared/game/missions.ts` | Mission schema and loading |
| `web/src/hooks/useGameLoop.ts` | Turn advancement, NPC line persistence |
| `web/src/App.tsx` | Ruby toggle visibility, beginner feedback, terminal classes |
| `web/src/App.css` | Globe styles, black backgrounds for terminal screens |
| `web/src/languages/curriculum/spanish.ts` | Argentine/Rioplatense curriculum config |
| `web/public/missions/<lang>/*.json` | Individual mission files |

## Environment Notes

- Working directory: `/mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru/`
- Platform: Linux (WSL)
- Node/npm projects exist in both root and `web/`
- Local git repo root: `/mnt/c/ANUBISNETHERREALM/polyglot/covert-ops-ru/`
- Remote: `git@github.com:jmorrow-ctrl/eternalintelligence.git`
