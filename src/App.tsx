import { useState, useCallback } from 'react';
import type { OptionLeg, MarketOutlook } from './types';
import { strategies, expirationChains, stockInfo } from './data';
import StrategySelector from './components/StrategySelector';
import StrikePicker from './components/StrikePicker';
import PayoffDiagram from './components/PayoffDiagram';
import StrategySummary from './components/StrategySummary';

function lookupContractData(
  leg: OptionLeg,
  overrides: Partial<Pick<OptionLeg, 'type' | 'position'>>,
): Partial<OptionLeg> {
  const type = overrides.type ?? leg.type;
  const position = overrides.position ?? leg.position;
  const chain = expirationChains.find((c) => c.date === leg.expiration);
  if (!chain) return {};
  const contract = chain.contracts.find((c) => c.strike === leg.strike);
  if (!contract) return {};

  const premium = position === 'long'
    ? (type === 'call' ? contract.callAsk : contract.putAsk)
    : (type === 'call' ? contract.callBid : contract.putBid);

  return {
    premium: Math.round(premium * 100) / 100,
    iv: type === 'call' ? contract.callIV : contract.putIV,
    delta: type === 'call' ? contract.callDelta : contract.putDelta,
    gamma: type === 'call' ? contract.callGamma : contract.putGamma,
    theta: type === 'call' ? contract.callTheta : contract.putTheta,
    vega: type === 'call' ? contract.callVega : contract.putVega,
  };
}

export default function App() {
  const [selectedOutlook, setSelectedOutlook] = useState<MarketOutlook | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<OptionLeg[]>([]);

  const handleToggleLeg = useCallback((leg: OptionLeg) => {
    setSelectedLegs((prev) => {
      const existing = prev.findIndex((l) => l.id === leg.id);
      if (existing >= 0) {
        return prev.filter((l) => l.id !== leg.id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, leg];
    });
  }, []);

  const handleRemoveLeg = useCallback((legId: string) => {
    setSelectedLegs((prev) => prev.filter((l) => l.id !== legId));
  }, []);

  const handleUpdateLeg = useCallback((
    legId: string,
    updates: Partial<Pick<OptionLeg, 'type' | 'position' | 'quantity'>>,
  ) => {
    setSelectedLegs((prev) =>
      prev.map((l) => {
        if (l.id !== legId) return l;
        const needsContractLookup = updates.type !== undefined || updates.position !== undefined;
        const contractData = needsContractLookup
          ? lookupContractData(l, updates)
          : {};
        return { ...l, ...updates, ...contractData };
      })
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedOutlook(null);
    setSelectedLegs([]);
  }, []);

  const handleLoadPreset = useCallback((strategyId: string) => {
    const strategy = strategies.find((s) => s.id === strategyId);
    if (!strategy) return;

    setSelectedLegs([]);

    const chain = expirationChains[0];
    const spot = stockInfo.price;
    const sorted = [...chain.contracts].sort((a, b) => a.strike - b.strike);
    const atmIdx = sorted.reduce((best, c, i) =>
      Math.abs(c.strike - spot) < Math.abs(sorted[best].strike - spot) ? i : best, 0);

    const newLegs: OptionLeg[] = strategy.legs.map((legDef, idx) => {
      let strikeIdx = atmIdx;
      if (legDef.relativeStrike === 'atm') {
        strikeIdx = atmIdx;
      } else if (legDef.relativeStrike === 'otm') {
        const offset = legDef.type === 'call' ? 2 + idx : -(2 + idx);
        strikeIdx = Math.max(0, Math.min(sorted.length - 1, atmIdx + offset));
      } else {
        const offset = legDef.type === 'call' ? -1 - idx : 1 + idx;
        strikeIdx = Math.max(0, Math.min(sorted.length - 1, atmIdx + offset));
      }

      const contract = sorted[strikeIdx];
      const premium = legDef.position === 'long'
        ? (legDef.type === 'call' ? contract.callAsk : contract.putAsk)
        : (legDef.type === 'call' ? contract.callBid : contract.putBid);

      return {
        id: `preset-${strategyId}-${idx}-${Date.now()}`,
        type: legDef.type,
        position: legDef.position,
        strike: contract.strike,
        premium: Math.round(premium * 100) / 100,
        quantity: 1,
        expiration: chain.date,
        iv: legDef.type === 'call' ? contract.callIV : contract.putIV,
        delta: legDef.type === 'call' ? contract.callDelta : contract.putDelta,
        gamma: legDef.type === 'call' ? contract.callGamma : contract.putGamma,
        theta: legDef.type === 'call' ? contract.callTheta : contract.putTheta,
        vega: legDef.type === 'call' ? contract.callVega : contract.putVega,
      };
    });

    setSelectedLegs(newLegs);
  }, []);

  const matchedStrategy = selectedLegs.length > 0
    ? strategies.find((s) => {
        if (s.legs.length !== selectedLegs.length) return false;
        return s.legs.every((sl, i) =>
          sl.type === selectedLegs[i]?.type && sl.position === selectedLegs[i]?.position
        );
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Header */}
      <header className="bg-[#161822] border-b border-gray-800 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-base font-bold text-white">Options Strategy Builder</span>
          </div>
          <div className="h-5 w-px bg-gray-700" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{stockInfo.symbol}</span>
            <span className="text-xs text-gray-500">{stockInfo.name}</span>
            <span className="text-sm font-mono font-bold text-white">${stockInfo.price.toFixed(2)}</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              stockInfo.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
              {stockInfo.change >= 0 ? '+' : ''}{stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
            </span>
          </div>
          {matchedStrategy && (
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
              {matchedStrategy.name}
            </span>
          )}
        </div>
        <button
          onClick={handleClearAll}
          className="px-3 py-1 text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer border border-gray-700"
        >
          Clear All
        </button>
      </header>

      {/* Main: 3-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar: Strategy presets */}
        <aside className="w-[260px] bg-[#12141c] border-r border-gray-800 p-3 flex flex-col overflow-hidden flex-shrink-0">
          <StrategySelector
            strategies={strategies}
            selectedStrategy={null}
            selectedOutlook={selectedOutlook}
            onSelectStrategy={(s) => handleLoadPreset(s.id)}
            onSelectOutlook={setSelectedOutlook}
          />
        </aside>

        {/* Center: Chart on top, picker below */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Payoff chart — top half */}
          <div className="h-[320px] p-4 pb-2 flex-shrink-0">
            <PayoffDiagram legs={selectedLegs} />
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-gray-800 flex-shrink-0" />

          {/* Strike picker — bottom half */}
          <div className="flex-1 min-h-0 p-4 pt-2">
            <StrikePicker
              expirationChains={expirationChains}
              selectedLegs={selectedLegs}
              onToggleLeg={handleToggleLeg}
              onRemoveLeg={handleRemoveLeg}
            />
          </div>
        </main>

        {/* Right sidebar: Position summary */}
        <aside className="w-[300px] bg-[#12141c] border-l border-gray-800 p-3 flex flex-col overflow-y-auto flex-shrink-0">
          <StrategySummary
            legs={selectedLegs}
            strategy={matchedStrategy ?? null}
            onRemoveLeg={handleRemoveLeg}
            onUpdateLeg={handleUpdateLeg}
          />
        </aside>
      </div>
    </div>
  );
}
