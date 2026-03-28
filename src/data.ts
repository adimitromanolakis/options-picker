import type { Strategy, ExpirationChain, StockInfo, OptionsContract } from './types';

// --- CSV parsing (unchanged) ---

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let field = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { cols.push(field); field = ''; continue; }
    field += ch;
  }
  cols.push(field);
  return cols;
}

function parseNum(val: string): number | undefined {
  if (!val || val === 'NA' || val === 'NaN') return undefined;
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

interface RawRow {
  type: 'C' | 'P';
  strike: number;
  expiration: string;
  bid: number;
  ask: number;
  iv?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  volume?: number;
}

function parseOptionsCSV(csv: string): RawRow[] {
  const lines = csv.split('\n').slice(1).filter(l => l.trim());
  const rows: RawRow[] = [];

  for (const line of lines) {
    const cols = parseCSVLine(line);
    const type = cols[1] as 'C' | 'P';
    const strike = parseFloat(cols[2]);
    const expiration = cols[3].trim();
    const bid = parseFloat(cols[5]);
    const ask = parseFloat(cols[6]);
    const vol = parseNum(cols[7]);
    const iv = parseNum(cols[15]);
    const delta = parseNum(cols[18]);
    const gamma = parseNum(cols[19]);
    const theta = parseNum(cols[20]);
    const vega = parseNum(cols[21]);

    if (isNaN(strike) || isNaN(bid) || isNaN(ask)) continue;

    rows.push({ type, strike, expiration, bid, ask, iv, delta, gamma, theta, vega, volume: vol });
  }

  return rows;
}

function buildExpirationChains(rows: RawRow[]): ExpirationChain[] {
  const byExpiration = new Map<string, Map<number, { call?: RawRow; put?: RawRow }>>();

  for (const row of rows) {
    if (!byExpiration.has(row.expiration)) {
      byExpiration.set(row.expiration, new Map());
    }
    const strikeMap = byExpiration.get(row.expiration)!;
    if (!strikeMap.has(row.strike)) {
      strikeMap.set(row.strike, {});
    }
    const entry = strikeMap.get(row.strike)!;
    if (row.type === 'C') entry.call = row;
    else entry.put = row;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chains: ExpirationChain[] = [];

  for (const [date, strikeMap] of [...byExpiration.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const expDate = new Date(date + 'T00:00:00');
    const dte = Math.max(0, Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const contracts: OptionsContract[] = [];

    for (const [strike, entry] of [...strikeMap.entries()].sort((a, b) => a[0] - b[0])) {
      const c = entry.call;
      const p = entry.put;

      contracts.push({
        strike,
        callBid: c?.bid ?? 0,
        callAsk: c?.ask ?? 0,
        callIV: c?.iv ?? 0,
        callDelta: c?.delta ?? 0,
        callGamma: c?.gamma ?? 0,
        callTheta: c?.theta ?? 0,
        callVega: c?.vega ?? 0,
        callVolume: c?.volume ?? 0,
        callOI: 0,
        putBid: p?.bid ?? 0,
        putAsk: p?.ask ?? 0,
        putIV: p?.iv ?? 0,
        putDelta: p?.delta ?? 0,
        putGamma: p?.gamma ?? 0,
        putTheta: p?.theta ?? 0,
        putVega: p?.vega ?? 0,
        putVolume: p?.volume ?? 0,
        putOI: 0,
      });
    }

    chains.push({ date, dte, contracts });
  }

  return chains;
}

// --- Mutable data exports ---

export let stockInfo: StockInfo = {
  symbol: '',
  name: '',
  price: 0,
  change: 0,
  changePercent: 0,
};

export let expirationChains: ExpirationChain[] = [];

export let dataLoaded = false;

// --- Version + listener system ---

let _version = 0;
const _listeners = new Set<() => void>();

export function getVersion() { return _version; }
export function subscribe(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function setOptionsData(newStock: StockInfo, newChains: ExpirationChain[]) {
  stockInfo = newStock;
  expirationChains = newChains;
  dataLoaded = true;
  _version++;
  _listeners.forEach(fn => fn());
}

// --- Load from files ---

export async function loadData() {
  const [csvText, symbolText] = await Promise.all([
    fetch('/option_data.csv').then(r => r.text()),
    fetch('/symbol.txt').then(r => r.text()),
  ]);

  const symbolJson = JSON.parse(symbolText);
  const stock: StockInfo = {
    symbol: symbolJson.symbol[0],
    name: symbolJson.symbol[0],
    price: symbolJson.last_price[0],
    change: 0,
    changePercent: 0,
  };

  const rawRows = parseOptionsCSV(csvText);
  const chains = buildExpirationChains(rawRows);

  setOptionsData(stock, chains);
}

// --- Strategies (static presets) ---

export const strategies: Strategy[] = [
  {
    id: 'long-call',
    name: 'Long Call',
    description: 'Buy a call option to profit from a price increase.',
    outlook: ['bullish'],
    legs: [
      { type: 'call', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Call' },
    ],
    maxProfit: 'Unlimited',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Strike + Premium',
  },
  {
    id: 'long-put',
    name: 'Long Put',
    description: 'Buy a put option to profit from a price decrease.',
    outlook: ['bearish'],
    legs: [
      { type: 'put', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Put' },
    ],
    maxProfit: 'Strike - Premium',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Strike - Premium',
  },
  {
    id: 'bull-call-spread',
    name: 'Bull Call Spread',
    description: 'Buy a call and sell a higher strike call to reduce cost. Profits from moderate upward movement.',
    outlook: ['bullish'],
    legs: [
      { type: 'call', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Call' },
      { type: 'call', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Call' },
    ],
    maxProfit: 'Width of Spread - Net Premium',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Lower Strike + Net Premium',
  },
  {
    id: 'bear-put-spread',
    name: 'Bear Put Spread',
    description: 'Buy a put and sell a lower strike put to reduce cost. Profits from moderate downward movement.',
    outlook: ['bearish'],
    legs: [
      { type: 'put', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Put' },
      { type: 'put', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Put' },
    ],
    maxProfit: 'Width of Spread - Net Premium',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Upper Strike - Net Premium',
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    description: 'Own the stock and sell a call against it. Generates income with limited upside.',
    outlook: ['bullish', 'neutral'],
    legs: [
      { type: 'call', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Call' },
    ],
    maxProfit: 'Strike - Stock Price + Premium',
    maxLoss: 'Stock Price - Premium',
    breakeven: 'Stock Price - Premium',
  },
  {
    id: 'cash-secured-put',
    name: 'Cash-Secured Put',
    description: 'Sell a put option while holding enough cash to buy the stock if assigned.',
    outlook: ['bullish', 'neutral'],
    legs: [
      { type: 'put', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Put' },
    ],
    maxProfit: 'Premium Received',
    maxLoss: 'Strike - Premium',
    breakeven: 'Strike - Premium',
  },
  {
    id: 'long-straddle',
    name: 'Long Straddle',
    description: 'Buy a call and put at the same strike. Profits from large moves in either direction.',
    outlook: ['volatile'],
    legs: [
      { type: 'call', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Call' },
      { type: 'put', position: 'long', relativeStrike: 'atm', description: 'Buy ATM Put' },
    ],
    maxProfit: 'Unlimited',
    maxLoss: 'Total Premium Paid',
    breakeven: 'Strike +/- Premium',
  },
  {
    id: 'long-strangle',
    name: 'Long Strangle',
    description: 'Buy an OTM call and an OTM put. Cheaper than straddle but needs a bigger move.',
    outlook: ['volatile'],
    legs: [
      { type: 'call', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Call' },
      { type: 'put', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Put' },
    ],
    maxProfit: 'Unlimited',
    maxLoss: 'Total Premium Paid',
    breakeven: 'Upper/Lower Strike +/- Premium',
  },
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    description: 'Sell an OTM put spread and an OTM call spread. Profits from low volatility.',
    outlook: ['neutral'],
    legs: [
      { type: 'put', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Put (lower)' },
      { type: 'put', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Put (higher)' },
      { type: 'call', position: 'short', relativeStrike: 'otm', description: 'Sell OTM Call (lower)' },
      { type: 'call', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Call (higher)' },
    ],
    maxProfit: 'Net Premium Received',
    maxLoss: 'Width of Spread - Premium',
    breakeven: 'Short Strikes +/- Premium',
  },
  {
    id: 'iron-butterfly',
    name: 'Iron Butterfly',
    description: 'Sell an ATM straddle and buy OTM wings. High probability, defined risk.',
    outlook: ['neutral'],
    legs: [
      { type: 'put', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Put' },
      { type: 'put', position: 'short', relativeStrike: 'atm', description: 'Sell ATM Put' },
      { type: 'call', position: 'short', relativeStrike: 'atm', description: 'Sell ATM Call' },
      { type: 'call', position: 'long', relativeStrike: 'otm', description: 'Buy OTM Call' },
    ],
    maxProfit: 'Net Premium Received',
    maxLoss: 'Width of Wing - Premium',
    breakeven: 'Short Strike +/- Premium',
  },
  {
    id: 'calendar-spread',
    name: 'Calendar Spread',
    description: 'Sell a near-term option and buy a longer-term option at the same strike.',
    outlook: ['neutral'],
    legs: [
      { type: 'call', position: 'short', relativeStrike: 'atm', description: 'Sell Near ATM Call' },
      { type: 'call', position: 'long', relativeStrike: 'atm', description: 'Buy Far ATM Call' },
    ],
    maxProfit: 'Limited (varies by IV)',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Complex (depends on near expiry)',
  },
  {
    id: 'butterfly-spread',
    name: 'Butterfly Spread',
    description: 'Buy one lower strike, sell two middle strikes, buy one higher strike. Profits from pinning.',
    outlook: ['neutral'],
    legs: [
      { type: 'call', position: 'long', relativeStrike: 'otm', description: 'Buy Lower Call' },
      { type: 'call', position: 'short', relativeStrike: 'atm', description: 'Sell 2 ATM Calls' },
      { type: 'call', position: 'long', relativeStrike: 'otm', description: 'Buy Higher Call' },
    ],
    maxProfit: 'Width of Spread - Net Premium',
    maxLoss: 'Net Premium Paid',
    breakeven: 'Lower Strike + Premium / Upper Strike - Premium',
  },
];
