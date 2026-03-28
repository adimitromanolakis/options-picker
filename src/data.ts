import type { Strategy, ExpirationChain, StockInfo } from './types';
import { readCSVOptionsData } from './lib/csvreader';

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

  const chains = readCSVOptionsData(csvText) as ExpirationChain[];

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
