import { useState, useMemo } from 'react';
import type { ExpirationChain, OptionLeg, OptionType, Position } from '../types';
import { stockInfo } from '../data';

interface Props {
  expirationChains: ExpirationChain[];
  selectedLegs: OptionLeg[];
  onToggleLeg: (leg: OptionLeg) => void;
  onRemoveLeg: (legId: string) => void;
}

type CellType = 'call-long' | 'call-short' | 'put-long' | 'put-short';

const MAX_LEGS = 4;

export default function StrikePicker({ expirationChains, selectedLegs, onToggleLeg, onRemoveLeg }: Props) {
  const [selectedExpirationIdx, setSelectedExpirationIdx] = useState(0);
  const [selectionMode, setSelectionMode] = useState<CellType>('call-long');
  const [hoveredCell, setHoveredCell] = useState<{ strike: number; type: CellType } | null>(null);

  const chain = expirationChains[selectedExpirationIdx];
  const spot = stockInfo.price;

  const visibleContracts = useMemo(() => {
    const sorted = [...chain.contracts].sort((a, b) => a.strike - b.strike);
    const atmIdx = sorted.reduce((best, c, i) =>
      Math.abs(c.strike - spot) < Math.abs(sorted[best].strike - spot) ? i : best, 0);
    const start = Math.max(0, atmIdx - 7);
    const end = Math.min(sorted.length, atmIdx + 8);
    return sorted.slice(start, end);
  }, [chain.contracts, spot]);

  function findLegAtStrike(strike: number, type: OptionType, position: Position): OptionLeg | undefined {
    return selectedLegs.find(
      (l) => l.strike === strike && l.type === type && l.position === position && l.expiration === chain.date
    );
  }

  function getLegIndex(strike: number, type: OptionType, position: Position): number {
    return selectedLegs.findIndex(
      (l) => l.strike === strike && l.type === type && l.position === position && l.expiration === chain.date
    );
  }

  function handleCellClick(strike: number, mode: CellType) {
    const type: OptionType = mode.includes('call') ? 'call' : 'put';
    const position: Position = mode.includes('long') ? 'long' : 'short';

    const existingIdx = getLegIndex(strike, type, position);
    if (existingIdx >= 0) {
      onRemoveLeg(selectedLegs[existingIdx].id);
      return;
    }

    if (selectedLegs.length >= MAX_LEGS) return;

    const contract = chain.contracts.find((c) => c.strike === strike);
    if (!contract) return;

    const premium = position === 'long'
      ? (type === 'call' ? contract.callAsk : contract.putAsk)
      : (type === 'call' ? contract.callBid : contract.putBid);

    const leg: OptionLeg = {
      id: `custom-${Date.now()}-${strike}-${type}-${position}`,
      type,
      position,
      strike,
      premium: Math.round(premium * 100) / 100,
      quantity: 1,
      expiration: chain.date,
      iv: type === 'call' ? contract.callIV : contract.putIV,
      delta: type === 'call' ? contract.callDelta : contract.putDelta,
      gamma: type === 'call' ? contract.callGamma : contract.putGamma,
      theta: type === 'call' ? contract.callTheta : contract.putTheta,
      vega: type === 'call' ? contract.callVega : contract.putVega,
    };

    onToggleLeg(leg);
  }

  function getCellState(strike: number, mode: CellType): 'none' | 'selected' | 'other-selected' {
    const type: OptionType = mode.includes('call') ? 'call' : 'put';
    const position: Position = mode.includes('long') ? 'long' : 'short';

    if (findLegAtStrike(strike, type, position)) return 'selected';

    const otherPosition: Position = position === 'long' ? 'short' : 'long';
    if (findLegAtStrike(strike, type, otherPosition)) return 'other-selected';

    return 'none';
  }

  const modeLabels: Record<CellType, { label: string; color: string }> = {
    'call-long': { label: 'Buy Call', color: 'emerald' },
    'call-short': { label: 'Sell Call', color: 'teal' },
    'put-long': { label: 'Buy Put', color: 'red' },
    'put-short': { label: 'Sell Put', color: 'orange' },
  };

  const colorClasses: Record<string, { bg: string; activeBg: string; border: string; text: string; hover: string }> = {
    emerald: { bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/30', border: 'border-emerald-500/50', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
    teal: { bg: 'bg-teal-500/10', activeBg: 'bg-teal-500/30', border: 'border-teal-500/50', text: 'text-teal-400', hover: 'hover:bg-teal-500/20' },
    red: { bg: 'bg-red-500/10', activeBg: 'bg-red-500/30', border: 'border-red-500/50', text: 'text-red-400', hover: 'hover:bg-red-500/20' },
    orange: { bg: 'bg-orange-500/10', activeBg: 'bg-orange-500/30', border: 'border-orange-500/50', text: 'text-orange-400', hover: 'hover:bg-orange-500/20' },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Expiration tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {expirationChains.map((ch, idx) => (
          <button
            key={ch.date}
            onClick={() => setSelectedExpirationIdx(idx)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              idx === selectedExpirationIdx
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {ch.date} <span className="text-gray-500">({ch.dte}d)</span>
          </button>
        ))}
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mr-1">Action:</span>
        {(Object.entries(modeLabels) as [CellType, { label: string; color: string }][]).map(([mode, { label, color }]) => {
          const colors = colorClasses[color];
          const isActive = selectionMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setSelectionMode(mode)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                isActive
                  ? `${colors.activeBg} ${colors.text} ${colors.border}`
                  : `${colors.bg} ${colors.text} border-transparent ${colors.hover}`
              }`}
            >
              {label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">
            {selectedLegs.length}/{MAX_LEGS} legs
          </span>
          {selectedLegs.length > 0 && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {selectedLegs.length === MAX_LEGS ? 'Max reached' : `${MAX_LEGS - selectedLegs.length} remaining`}
            </span>
          )}
        </div>
      </div>

      {/* Chain grid */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border border-gray-800 bg-gray-900/50">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_1fr] text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-[#12141c] border-b border-gray-800 z-10">
          <div className="flex items-center justify-end pr-3 py-1.5 gap-3">
            <span>CALLS</span>
          </div>
          <div className="flex items-center justify-center py-1.5">Strike</div>
          <div className="flex items-center pl-3 py-1.5 gap-3">
            <span>PUTS</span>
          </div>
        </div>

        {visibleContracts.map((contract) => {
          const isATM = Math.abs(contract.strike - spot) < 1.5;

          // Check states for all 4 possible legs at this strike
          const callLongState = getCellState(contract.strike, 'call-long');
          const callShortState = getCellState(contract.strike, 'call-short');
          const putLongState = getCellState(contract.strike, 'put-long');
          const putShortState = getCellState(contract.strike, 'put-short');

          const callLongLeg = findLegAtStrike(contract.strike, 'call', 'long');
          const callShortLeg = findLegAtStrike(contract.strike, 'call', 'short');
          const putLongLeg = findLegAtStrike(contract.strike, 'put', 'long');
          const putShortLeg = findLegAtStrike(contract.strike, 'put', 'short');

          const hovered = hoveredCell?.strike === contract.strike;

          return (
            <div
              key={contract.strike}
              className={`grid grid-cols-[1fr_80px_1fr] border-b border-gray-800/50 text-xs transition-colors ${
                hovered ? 'bg-gray-800/60' : isATM ? 'bg-indigo-500/5' : ''
              }`}
            >
              {/* Call side - bid/ask clickable */}
              <div className="flex items-stretch border-r border-gray-800/50">
                {/* Buy call */}
                <button
                  onClick={() => handleCellClick(contract.strike, 'call-long')}
                  onMouseEnter={() => setHoveredCell({ strike: contract.strike, type: 'call-long' })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`flex-1 flex items-center justify-end px-2 py-1.5 transition-all cursor-pointer relative ${
                    callLongState === 'selected'
                      ? 'bg-emerald-500/25 ring-1 ring-inset ring-emerald-500/60'
                      : 'hover:bg-emerald-500/10'
                  }`}
                  disabled={selectedLegs.length >= MAX_LEGS && callLongState === 'none'}
                >
                  <span className="text-gray-400 text-[10px] mr-2">${contract.callAsk.toFixed(2)}</span>
                  <span className={`font-mono font-medium ${
                    contract.strike < spot ? 'text-emerald-300' : 'text-gray-300'
                  }`}>
                    {contract.callDelta.toFixed(2)}
                  </span>
                  {callLongLeg && (
                    <span className="absolute top-0.5 right-1 text-[8px] text-emerald-400 font-bold">B</span>
                  )}
                </button>

                {/* Sell call */}
                <button
                  onClick={() => handleCellClick(contract.strike, 'call-short')}
                  onMouseEnter={() => setHoveredCell({ strike: contract.strike, type: 'call-short' })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`flex-1 flex items-center justify-end px-2 py-1.5 transition-all cursor-pointer relative ${
                    callShortState === 'selected'
                      ? 'bg-teal-500/25 ring-1 ring-inset ring-teal-500/60'
                      : 'hover:bg-teal-500/10'
                  }`}
                  disabled={selectedLegs.length >= MAX_LEGS && callShortState === 'none'}
                >
                  <span className="text-gray-400 text-[10px] mr-2">${contract.callBid.toFixed(2)}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{(contract.callIV * 100).toFixed(0)}%</span>
                  {callShortLeg && (
                    <span className="absolute top-0.5 right-1 text-[8px] text-teal-400 font-bold">S</span>
                  )}
                </button>
              </div>

              {/* Strike */}
              <div className={`flex items-center justify-center font-bold text-sm ${
                isATM ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300'
              }`}>
                {contract.strike.toFixed(0)}
                {isATM && <span className="ml-0.5 text-[8px] text-indigo-500">ATM</span>}
              </div>

              {/* Put side */}
              <div className="flex items-stretch">
                {/* Buy put */}
                <button
                  onClick={() => handleCellClick(contract.strike, 'put-long')}
                  onMouseEnter={() => setHoveredCell({ strike: contract.strike, type: 'put-long' })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`flex-1 flex items-center px-2 py-1.5 transition-all cursor-pointer relative ${
                    putLongState === 'selected'
                      ? 'bg-red-500/25 ring-1 ring-inset ring-red-500/60'
                      : 'hover:bg-red-500/10'
                  }`}
                  disabled={selectedLegs.length >= MAX_LEGS && putLongState === 'none'}
                >
                  <span className={`font-mono font-medium ${
                    contract.strike > spot ? 'text-red-300' : 'text-gray-300'
                  }`}>
                    {contract.putDelta.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-[10px] ml-2">${contract.putAsk.toFixed(2)}</span>
                  {putLongLeg && (
                    <span className="absolute top-0.5 left-1 text-[8px] text-red-400 font-bold">B</span>
                  )}
                </button>

                {/* Sell put */}
                <button
                  onClick={() => handleCellClick(contract.strike, 'put-short')}
                  onMouseEnter={() => setHoveredCell({ strike: contract.strike, type: 'put-short' })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`flex-1 flex items-center px-2 py-1.5 transition-all cursor-pointer relative ${
                    putShortState === 'selected'
                      ? 'bg-orange-500/25 ring-1 ring-inset ring-orange-500/60'
                      : 'hover:bg-orange-500/10'
                  }`}
                  disabled={selectedLegs.length >= MAX_LEGS && putShortState === 'none'}
                >
                  <span className="text-gray-500 font-mono text-[10px]">{(contract.putIV * 100).toFixed(0)}%</span>
                  <span className="text-gray-400 text-[10px] ml-2">${contract.putBid.toFixed(2)}</span>
                  {putShortLeg && (
                    <span className="absolute top-0.5 left-1 text-[8px] text-orange-400 font-bold">S</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/40" /> Buy Call
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-teal-500/40" /> Sell Call
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500/40" /> Buy Put
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-orange-500/40" /> Sell Put
        </span>
        <span className="ml-auto text-gray-600">Click a cell to toggle · Max {MAX_LEGS} legs</span>
      </div>
    </div>
  );
}
