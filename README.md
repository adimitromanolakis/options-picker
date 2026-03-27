# Options Strategy Builder

An interactive options combination picker for building and visualizing multi-leg options strategies, inspired by the moomoo desktop app.

## Features

- **12 preset strategies** — Long/Short Call/Put, Spreads, Straddles, Strangles, Iron Condor, Butterfly, Calendar, Covered Call, and more
- **Market outlook filter** — Filter strategies by Bullish, Bearish, Neutral, or Volatile outlook
- **Interactive strike picker** — Click cells in the options chain grid to add up to 4 legs; toggle Buy/Sell and Call/Put per leg
- **Real-time payoff diagram** — P&L chart updates instantly as you build your position; scroll to zoom, drag to pan
- **Editable position summary** — Change action (Buy/Sell), type (Call/Put), and quantity per leg in the right sidebar
- **Greeks display** — Net Delta, Gamma, Theta, Vega calculated across all legs

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS v4
- Recharts

## Note

All options data (premiums, IV, Greeks) is synthetic — generated with simple heuristics, not Black-Scholes. This is a UI demo, not a production trading tool.
