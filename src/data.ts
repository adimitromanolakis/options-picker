import type { Strategy, ExpirationChain, StockInfo } from './types';

export const stockInfo: StockInfo = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 178.50,
  change: 2.35,
  changePercent: 1.33,
};

function generateContracts(spotPrice: number, dte: number): import('./types').OptionsContract[] {
  const contracts: import('./types').OptionsContract[] = [];
  const baseIV = 0.28 + (dte / 365) * 0.05;
  const strikes: number[] = [];

  for (let s = spotPrice - 30; s <= spotPrice + 30; s += 2.5) {
    strikes.push(Math.round(s * 100) / 100);
  }

  for (const strike of strikes) {
    const moneyness = (spotPrice - strike) / spotPrice;
    const timeValue = Math.max(0.5, 3.5 * Math.sqrt(dte / 30));
    const callIntrinsic = Math.max(0, spotPrice - strike);
    const putIntrinsic = Math.max(0, strike - spotPrice);

    const callIV = baseIV + moneyness * 0.08 + Math.random() * 0.02;
    const putIV = baseIV - moneyness * 0.08 + Math.random() * 0.02;

    const callPrice = callIntrinsic + timeValue * (1 - moneyness * 0.5);
    const putPrice = putIntrinsic + timeValue * (1 + moneyness * 0.5);

    const d1 = moneyness / (callIV * Math.sqrt(dte / 365)) + 0.5 * callIV * Math.sqrt(dte / 365);
    const callDelta = Math.max(0.01, Math.min(0.99, normalCDF(d1)));
    const putDelta = callDelta - 1;

    contracts.push({
      strike,
      callBid: Math.max(0.01, callPrice - 0.05 - Math.random() * 0.1),
      callAsk: callPrice + 0.05 + Math.random() * 0.1,
      callIV: Math.round(callIV * 10000) / 10000,
      callDelta: Math.round(callDelta * 1000) / 1000,
      callGamma: Math.round((0.02 / (callIV * Math.sqrt(dte / 365))) * 10000) / 10000,
      callTheta: Math.round((-callPrice / dte) * 100) / 100,
      callVega: Math.round((callPrice * 0.1 * Math.sqrt(dte / 365)) * 100) / 100,
      callVolume: Math.floor(Math.random() * 5000 + 100),
      callOI: Math.floor(Math.random() * 20000 + 500),
      putBid: Math.max(0.01, putPrice - 0.05 - Math.random() * 0.1),
      putAsk: putPrice + 0.05 + Math.random() * 0.1,
      putIV: Math.round(putIV * 10000) / 10000,
      putDelta: Math.round(putDelta * 1000) / 1000,
      putGamma: Math.round((0.02 / (putIV * Math.sqrt(dte / 365))) * 10000) / 10000,
      putTheta: Math.round((-putPrice / dte) * 100) / 100,
      putVega: Math.round((putPrice * 0.1 * Math.sqrt(dte / 365)) * 100) / 100,
      putVolume: Math.floor(Math.random() * 3000 + 50),
      putOI: Math.floor(Math.random() * 15000 + 300),
    });
  }

  return contracts;
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export const expirationChains: ExpirationChain[] = [
  { date: '2026-04-03', dte: 7, contracts: generateContracts(stockInfo.price, 7) },
  { date: '2026-04-10', dte: 14, contracts: generateContracts(stockInfo.price, 14) },
  { date: '2026-04-17', dte: 21, contracts: generateContracts(stockInfo.price, 21) },
  { date: '2026-04-24', dte: 28, contracts: generateContracts(stockInfo.price, 28) },
  { date: '2026-05-15', dte: 49, contracts: generateContracts(stockInfo.price, 49) },
  { date: '2026-06-19', dte: 84, contracts: generateContracts(stockInfo.price, 84) },
  { date: '2026-09-18', dte: 175, contracts: generateContracts(stockInfo.price, 175) },
];

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
