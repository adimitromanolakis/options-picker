# File Overview

## Config

- **`package.json`** — Project dependencies (React, Vite, Tailwind, Recharts) and scripts.
- **`vite.config.ts`** — Vite config with React and Tailwind CSS v4 plugins.
- **`tsconfig.json`** / **`tsconfig.app.json`** / **`tsconfig.node.json`** — TypeScript configuration.
- **`index.html`** — Entry HTML shell.

## Source

### Core

- **`src/main.tsx`** — React entry point, mounts `<App />` into the DOM.
- **`src/index.css`** — Global styles, Tailwind import, dark theme base.
- **`src/App.css`** — Empty (styles handled by Tailwind).
- **`src/types.ts`** — TypeScript types: `OptionLeg`, `Strategy`, `OptionsContract`, `ExpirationChain`, `StockInfo`, and union types for `OptionType`, `Position`, `MarketOutlook`.
- **`src/data.ts`** — Synthetic options data generator. Produces 7 expiration chains with 25 strikes each, 12 preset strategy definitions, and stock info. Premiums, IV, and Greeks are approximated with simple heuristics (no Black-Scholes).

### Components

- **`src/App.tsx`** — Main layout: three-column shell (presets | chart + picker | position summary). Manages leg state and provides callbacks for adding/removing/updating legs.
- **`src/components/StrategySelector.tsx`** — Left sidebar. Market outlook filter buttons (Bullish/Bearish/Neutral/Volatile) and scrollable list of preset strategies filtered by outlook.
- **`src/components/StrikePicker.tsx`** — Center bottom. Interactive options chain grid. Each strike row has 4 clickable zones (Buy Call, Sell Call, Buy Put, Sell Put). Supports expiration tabs and an action mode selector. Max 4 legs.
- **`src/components/PayoffDiagram.tsx`** — Center top. Recharts AreaChart showing P&L at expiration. Fixed x-axis range with mouse wheel zoom and drag-to-pan. Reference lines for spot price, breakeven, and strikes.
- **`src/components/StrategySummary.tsx`** — Right sidebar. Editable leg cards with Buy/Sell toggle, Call/Put toggle, quantity input, and delete button. Shows net Greeks and net debit/credit.
- **`src/components/OptionsChain.tsx`** — Legacy component (superseded by StrikePicker). Not used in current layout.
