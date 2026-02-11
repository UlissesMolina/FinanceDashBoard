# Finance Dashboard

A personal finance tracking web app that visualizes income, expenses, and transaction history with interactive charts and month-based filtering.

## Tech stack

- **React 19** + **TypeScript**
- **GraphQL** (Apollo Client) with client-side schema and resolvers
- **Recharts** for balance, spending-by-category, and sparkline charts
- **date-fns** for date handling; **Lucide React** icons; **Radix UI** for dialogs

## Features

- Overview cards: total income, total expense, net amount, transaction count (with sparklines)
- Balance-over-time and spending-by-category charts
- Filterable transactions table
- Month picker and month-over-month comparison
- Landing page and dashboard flow

## Getting started

```bash
npm install
npm start
```

Runs the app at [http://localhost:3000](http://localhost:3000).

**Other scripts**

- `npm run build` — production build
- `npm test` — run tests

## Project structure

- `src/` — React app: `App.tsx`, `Dashboard.tsx`, `components/`, `graphql/` (schema, resolvers, queries, client), `types/`, `utils/` (calculations, formatters, mock data)
- `public/` — static assets and `index.html`

Data is served via a client-side GraphQL layer (mock data); no backend required to run.
