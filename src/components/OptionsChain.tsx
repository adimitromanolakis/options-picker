import { useState } from 'react';
import type { ExpirationChain, OptionsContract, OptionLeg, Strategy } from '../types';
import { stockInfo } from '../data';

interface Props {
  expirationChains: ExpirationChain[];
  selectedStrategy: Strategy | null;
  selectedLegs: OptionLeg[];
  onToggleLeg: (leg: OptionLeg) => void;
}

function getStrikeForLeg(
  contracts: OptionsContract[],
  relativeStrike: 'itm' | 'atm' | 'otm',
  type: 'call' | 'put',
  position: 'long' | 'short',
): number {
  const spot = stockInfo.price;
  const sorted = [...contracts].sort((a, b) => a.strike - b.strike);
  const atmIdx = sorted.reduce((best, c, i) =>
    Math.abs(c.strike - spot) < Math.abs(sorted[best].strike - spot) ? i : best, 0);

  if (relativeStrike === 'atm') return sorted[atmIdx].strike;

  const offset = type === 'call' ? (position === 'long' ? 2 : -2) : (position === 'long' ? -2 : 2);
  const idx = Math.max(0, Math.min(sorted.length - 1, atmIdx + offset));
  return sorted[idx].strike;
}

export default function OptionsChain({ expirationChains, selectedStrategy, selectedLegs, onToggleLeg }: Props) {
  const [selectedExpirationIdx, setSelectedExpirationIdx] = useState(0);
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null);

  const chain = expirationChains[selectedExpirationIdx];
  const spot = stockInfo.price;

  function isLegSelected(legIdx: number): boolean {
    return selectedLegs.some((l) => l.id === `${selectedStrategy?.id}-${legIdx}`);
  }

  function getContractForStrike(strike: number): OptionsContract | undefined {
    return chain.contracts.find((c) => c.strike === strike);
  }

  function handleStrikeClick(strike: number, side: 'call' | 'put') {
    if (!selectedStrategy) return;

    const legIdx = selectedStrategy.legs.findIndex(
      (l) => l.type === side && !isLegSelected(selectedStrategy.legs.indexOf(l))
    );
    if (legIdx === -1) return;

    const legDef = selectedStrategy.legs[legIdx];
    const contract = getContractForStrike(strike);
    if (!contract) return;

    const premium = legDef.position === 'long'
      ? (side === 'call' ? contract.callAsk : contract.putAsk)
      : (side === 'call' ? contract.callBid : contract.putBid);

    const leg: OptionLeg = {
      id: `${selectedStrategy.id}-${legIdx}`,
      type: legDef.type,
      position: legDef.position,
      strike,
      premium: Math.round(premium * 100) / 100,
      quantity: 1,
      expiration: chain.date,
      iv: side === 'call' ? contract.callIV : contract.putIV,
      delta: side === 'call' ? contract.callDelta : contract.putDelta,
      gamma: side === 'call' ? contract.callGamma : contract.putGamma,
      theta: side === 'call' ? contract.callTheta : contract.putTheta,
      vega: side === 'call' ? contract.callVega : contract.putVega,
    };

    onToggleLeg(leg);
  }

  function autoFillStrategy() {
    if (!selectedStrategy) return;

    selectedStrategy.legs.forEach((legDef, idx) => {
      const strike = getStrikeForLeg(chain.contracts, legDef.relativeStrike, legDef.type, legDef.position);
      const contract = getContractForStrike(strike);
      if (!contract) return;

      const premium = legDef.position === 'long'
        ? (legDef.type === 'call' ? contract.callAsk : contract.putAsk)
        : (legDef.type === 'call' ? contract.callBid : contract.putBid);

      const leg: OptionLeg = {
        id: `${selectedStrategy.id}-${idx}`,
        type: legDef.type,
        position: legDef.position,
        strike,
        premium: Math.round(premium * 100) / 100,
        quantity: 1,
        expiration: chain.date,
        iv: legDef.type === 'call' ? contract.callIV : contract.putIV,
        delta: legDef.type === 'call' ? contract.callDelta : contract.putDelta,
        gamma: legDef.type === 'call' ? contract.callGamma : contract.putGamma,
        theta: legDef.type === 'call' ? contract.callTheta : contract.putTheta,
        vega: legDef.type === 'call' ? contract.callVega : contract.putVega,
      };

      onToggleLeg(leg);
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Expiration tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {expirationChains.map((chain, idx) => (
          <button
            key={chain.date}
            onClick={() => setSelectedExpirationIdx(idx)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              idx === selectedExpirationIdx
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {chain.date} <span className="text-gray-400">({chain.dte}d)</span>
          </button>
        ))}
      </div>

      {selectedStrategy && (
        <button
          onClick={autoFillStrategy}
          className="mb-3 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-md text-xs font-medium hover:bg-indigo-500/30 transition-all cursor-pointer border border-indigo-500/30"
        >
          Auto-fill {selectedStrategy.name} at current expiration
        </button>
      )}

      {/* Chain header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1 px-1">
        <div className="grid grid-cols-3 text-right pr-2">
          <span>Vol</span>
          <span>IV</span>
          <span>Ask</span>
        </div>
        <div className="px-2 text-center">Strike</div>
        <div className="grid grid-cols-3 text-left pl-2">
          <span>Bid</span>
          <span>IV</span>
          <span>Vol</span>
        </div>
      </div>

      {/* Chain rows */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border border-gray-800">
        {chain.contracts.map((contract) => {
          const isATM = Math.abs(contract.strike - spot) < 1.5;
          const isITMCall = contract.strike < spot;
          const isITMPut = contract.strike > spot;
          const isHovered = hoveredStrike === contract.strike;

          return (
            <div
              key={contract.strike}
              className={`grid grid-cols-[1fr_auto_1fr] gap-0 text-xs border-b border-gray-800/50 transition-colors ${
                isHovered ? 'bg-gray-800/80' : isATM ? 'bg-indigo-500/5' : ''
              }`}
              onMouseEnter={() => setHoveredStrike(contract.strike)}
              onMouseLeave={() => setHoveredStrike(null)}
            >
              {/* Call side */}
              <button
                onClick={() => handleStrikeClick(contract.strike, 'call')}
                className="grid grid-cols-3 text-right pr-2 py-1.5 hover:bg-emerald-500/10 transition-colors cursor-pointer border-r border-gray-800/50"
                disabled={!selectedStrategy}
              >
                <span className="text-gray-500">{contract.callVolume.toLocaleString()}</span>
                <span className="text-gray-400">{(contract.callIV * 100).toFixed(1)}%</span>
                <span className={`font-medium ${isITMCall ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {contract.callAsk.toFixed(2)}
                </span>
              </button>

              {/* Strike */}
              <div className={`px-3 py-1.5 text-center font-bold min-w-[70px] flex items-center justify-center ${
                isATM ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 bg-gray-800/30'
              }`}>
                {contract.strike.toFixed(1)}
                {isATM && <span className="ml-1 text-[9px] text-indigo-400">ATM</span>}
              </div>

              {/* Put side */}
              <button
                onClick={() => handleStrikeClick(contract.strike, 'put')}
                className="grid grid-cols-3 text-left pl-2 py-1.5 hover:bg-red-500/10 transition-colors cursor-pointer"
                disabled={!selectedStrategy}
              >
                <span className={`font-medium ${isITMPut ? 'text-red-400' : 'text-gray-300'}`}>
                  {contract.putBid.toFixed(2)}
                </span>
                <span className="text-gray-400">{(contract.putIV * 100).toFixed(1)}%</span>
                <span className="text-gray-500">{contract.putVolume.toLocaleString()}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
