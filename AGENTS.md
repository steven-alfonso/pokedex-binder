# AGENTS.md

## Commands
- `npm start` — runs `node server.js` (no build step, no bundler)
- `npm test` — no tests configured (ignore)

## Architecture
- Single Express 5 server on **hardcoded port 5001**
- Frontend is **vanilla JS/HTML/CSS** in `public/` — no framework, no bundler, no hot reload
- Pokémon data loaded from `data/pokedex.csv` at startup; server **exits with code 1** if CSV is missing or malformed
- All binder state (slots, rows, columns, pages) persisted in **SQLite** at `data/binder.db` via `better-sqlite3`
- Binder ID is a 6-char alphanumeric string; passed via `?id=` URL param
- Server is source of truth; localStorage is a cache/fallback

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pokedex` | Returns all Pokémon from CSV |
| POST | `/api/binder` | Creates a new binder (optional `{state}` body for migration). Returns `{id}` |
| GET | `/api/binder/:id` | Returns state `{binderSlots, rows, columns, pages}` |
| PUT | `/api/binder/:id` | Updates state with request body |

## Gotchas
- Express 5 is used — some v4 middleware patterns may differ
- No lint, typecheck, or formatter config exists
- Adding new Pokémon to the CSV requires a server restart
- Port cannot be configured via env; edit `server.js` to change it
- The `binder_states` SQLite table has columns: `id TEXT PK`, `state TEXT` (JSON), `created_at`, `updated_at`
