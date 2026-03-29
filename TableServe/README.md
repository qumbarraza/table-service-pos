# TableServe POS

Offline-first table service POS built with React, Express, and SQLite for single-computer restaurant use.

## Features

- Floor and table management with visual status cards
- Fast menu punching with search and one-tap add
- Auto-saving open orders to local SQLite
- Kitchen receipt printing and customer bill printing
- Billing flow with cash, card, and split payment options
- Move table, merge table, clear table, and close paid table
- Daily summary reporting with CSV export
- Settings screens for floors, tables, categories, products, and restaurant name

## Project Structure

```text
/frontend
  /src
    /components
    /pages
    /store
    /utils
/backend
  /controllers
  /database
  /routes
  /schema
```

## Install

```bash
npm install
cd frontend && npm install
```

On PowerShell systems with script policy restrictions, use `cmd /c npm ...` if plain `npm` is blocked.

## Run

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run frontend
```

Both together:

```bash
npm run dev
```

Frontend dev server runs on `http://localhost:5173` and proxies API requests to `http://localhost:4000`.

## Database

SQLite file is created automatically at:

`backend/database/tableserve.sqlite`

The app seeds:

- 3 floors
- 18 tables
- 4 categories
- 8 products
- sample open and printed orders

## Build

```bash
cd frontend && npm run build
```

## Notes

- Printing is implemented with browser popup printing for offline use.
- The app is designed for a single machine and does not require internet access.
