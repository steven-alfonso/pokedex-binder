# Pokédex Binder Sorter

A virtual binder for collecting and organizing Pokémon. Search, add, and arrange your collection across customizable pages — persisted server-side in SQLite.

## Features

- **Custom binder setup** — configure rows, columns, and total pages
- **Search & add** — find any Pokémon by name or Pokédex number; double-click or use the Add button
- **Book-style layout** — two-page spreads with page-edge depth shading, or single-page view on mobile
- **Type-colored cards** — each card shows the Pokémon's name, number, and type badges with matching colors
- **Persistent storage** — binder state is saved server-side in SQLite; syncs on every change
- **Fully responsive** — works on desktop and mobile

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:5001](http://localhost:5001), configure your binder dimensions, and start collecting.

## Running with Podman

Build the image:

```bash
podman build -t pokedex-binder .
```

Run the container (the `data/` volume persists your binder database):

```bash
podman run -p 5001:5001 -v $(pwd)/data:/data pokedex-binder
```

> **CTRL+C doesn't stop the container?** Add `--init` to use `catatonit` as PID 1, which properly forwards signals to the Node process:
>
> ```bash
> podman run --init -p 5001:5001 -v $(pwd)/data:/data pokedex-binder
> ```

> **Volume permissions:** The container runs as the `node` user (UID 1000). If your host's `./data` directory isn't writable by UID 1000, the app will fail to create `binder.db`. Fix with:
>
> ```bash
> sudo chown 1000:1000 ./data
> ```

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla JavaScript, CSS
- **Data**: CSV → JSON API

## Project Structure

```
├── Dockerfile
├── server.js          # Express server, serves API and static files
├── public/
│   ├── index.html     # Setup, search, and binder UI
│   ├── styles.css     # Full binder styling with type-themed cards
│   └── app.js         # Client-side logic (search, binder, persistence)
├── data/
│   └── pokedex.csv    # Complete Pokémon dataset (1-1025)
└── package.json
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/pokedex` | Returns all Pokémon from CSV |
| `POST /api/binder` | Creates a new binder; returns `{id}` |
| `GET /api/binder/:id` | Returns binder state `{binderSlots, rows, columns, pages}` |
| `PUT /api/binder/:id` | Updates binder state |

## License

ISC
