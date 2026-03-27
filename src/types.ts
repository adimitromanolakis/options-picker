export type OptionType = 'call' | 'put';
export type Position = 'long' | 'short';
export type MarketOutlook = 'bullish' | 'bearish' | 'neutral' | 'volatile';

export interface OptionLeg {
  id: string;
  type: OptionType;
  position: Position;
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  outlook: MarketOutlook[];
  legs: {
    type: OptionType;
    position: Position;
    relativeStrike: 'itm' | 'atm' | 'otm';
    description: string;
  }[];
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
}

export interface OptionsContract {
  strike: number;
  callBid: number;
  callAsk: number;
  callIV: number;
  callDelta: number;
  callGamma: number;
  callTheta: number;
  callVega: number;
  callVolume: number;
  callOI: number;
  putBid: number;
  putAsk: number;
  putIV: number;
  putDelta: number;
  putGamma: number;
  putTheta: number;
  putVega: number;
  putVolume: number;
  putOI: number;
}

export interface ExpirationChain {
  date: string;
  dte: number;
  contracts: OptionsContract[];
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}
