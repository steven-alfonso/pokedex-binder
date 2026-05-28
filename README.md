# Pokédex Binder Sorter

A virtual binder for collecting and organizing Pokémon. Search, add, and arrange your collection across customizable pages — all saved in your browser.

## Features

- **Custom binder setup** — configure rows, columns, and total pages
- **Search & add** — find any Pokémon by name or Pokédex number; double-click or use the Add button
- **Book-style layout** — two-page spreads with page-edge depth shading, or single-page view on mobile
- **Type-colored cards** — each card shows the Pokémon's name, number, and type badges with matching colors
- **Persistent storage** — your collection is saved to localStorage and survives refreshes
- **Fully responsive** — works on desktop and mobile
- **No database required** — Pokémon data is loaded from a CSV file

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:5001](http://localhost:5001), configure your binder dimensions, and start collecting.

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla JavaScript, CSS
- **Data**: CSV → JSON API

## Project Structure

```
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
| `GET /api/pokedex` | Returns all Pokémon as JSON array |

## License

ISC
