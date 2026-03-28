import { useState, useMemo } from 'react';
import type { ExpirationChain, OptionLeg, OptionType, Position } from '../types';
import { stockInfo } from '../data';
import { useTheme } from '../ThemeContext';

interface Props {
  expirationChains: ExpirationChain[];
  selectedLegs: OptionLeg[];
  onToggleLeg: (leg: OptionLeg) => void;
  onRemoveLeg: (legId: string) => void;
}

const MAX_LEGS = 4;

export default function StrikePicker({ expirationChains, selectedLegs, onToggleLeg, onRemoveLeg }: Props) {
  const { theme } = useTheme();
  const [selectedExpirationIdx, setSelectedExpirationIdx] = useState(0);
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null);

  const chain = expirationChains[selectedExpirationIdx];
  const spot = stockInfo.price;

  const visibleContracts = useMemo(() => {
    if (!chain?.contracts?.length) return [];
    const sorted = [...chain.contracts].sort((a, b) => a.strike - b.strike);
    const atmIdx = sorted.reduce((best, c, i) =>
      Math.abs(c.strike - spot) < Math.abs(sorted[best].strike - spot) ? i : best, 0);
    const start = Math.max(0, atmIdx - 12);
    const end = Math.min(sorted.length, atmIdx + 13);
    return sorted.slice(start, end);
  }, [chain?.contracts, spot]);

  const minStrikeDiff = useMemo(() => {
    if (!chain?.contracts?.length) return 2.5;
    const sorted = [...chain.contracts].map(c => c.strike).sort((a, b) => a - b);
    let min = Infinity;
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i] - sorted[i - 1];
      if (diff > 0 && diff < min) min = diff;
    }
    return min === Infinity ? 2.5 : min;
  }, [chain?.contracts]);

  function handleCellClick(strike: number, side: 'call' | 'put', col: 'bid' | 'ask') {
    if (!chain) return;
    const type: OptionType = side;
    const position: Position = col === 'ask' ? 'long' : 'short';

    const existing = selectedLegs.find(
      (l) => l.strike === strike && l.type === type && l.position === position && l.expiration === chain.date
    );
    if (existing) {
      onRemoveLeg(existing.id);
      return;
    }

    if (selectedLegs.length >= MAX_LEGS) return;

    const contract = chain.contracts.find((c) => c.strike === strike);
    if (!contract) return;

    const premium = col === 'ask'
      ? (type === 'call' ? contract.callAsk : contract.putAsk)
      : (type === 'call' ? contract.callBid : contract.putBid);
    if (premium === 0) return;

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

  function isLegSelected(strike: number, side: 'call' | 'put', col: 'bid' | 'ask'): boolean {
    if (!chain) return false;
    const position: Position = col === 'ask' ? 'long' : 'short';
    return selectedLegs.some(
      (l) => l.strike === strike && l.type === side && l.position === position && l.expiration === chain.date
    );
  }

  if (!chain) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-sm" style={{ color: theme.text.muted }}>
        No options data loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Expiration tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
        {expirationChains.map((ch, idx) => (
          <button
            key={ch.date}
            onClick={() => setSelectedExpirationIdx(idx)}
            className="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer"
            style={{
              background: idx === selectedExpirationIdx ? '#6366f1' : theme.button.bg,
              color: idx === selectedExpirationIdx ? '#ffffff' : theme.text.secondary,
            }}
          >
            {ch.date} <span style={{ color: theme.text.muted }}>({ch.dte}d)</span>
          </button>
        ))}
      </div>

      {/* Chain grid */}
      <div
        className="flex-1 overflow-y-auto min-h-0 rounded-lg border"
        style={{ background: theme.chart.bg, borderColor: theme.app.border }}
      >
        {/* Header row */}
        <div
          className="grid grid-cols-[1fr_80px_1fr] text-[10px] font-semibold uppercase tracking-wider sticky top-0 border-b z-10"
          style={{ background: theme.app.sidebarBg, borderColor: theme.app.border }}
        >
          <div className="grid grid-cols-4 text-center py-1.5 px-1" style={{ color: theme.text.muted }}>
            <span>Vol</span>
            <span>IV</span>
            <span style={{ color: theme.buy.text }}>Ask</span>
            <span style={{ color: theme.sell.text }}>Bid</span>
          </div>
          <div className="flex items-center justify-center py-1.5" style={{ color: theme.text.secondary }}>Strike</div>
          <div className="grid grid-cols-4 text-center py-1.5 px-1" style={{ color: theme.text.muted }}>
            <span style={{ color: theme.sell.text }}>Bid</span>
            <span style={{ color: theme.buy.text }}>Ask</span>
            <span>IV</span>
            <span>Vol</span>
          </div>
        </div>

        {/* Data rows */}
        {visibleContracts.map((contract) => {
          const isATM = Math.abs(contract.strike - spot) <= minStrikeDiff;

          return (
            <div
              key={contract.strike}
              className="grid grid-cols-[1fr_80px_1fr] border-b transition-colors"
              style={{
                borderColor: theme.app.borderLight,
                background: hoveredStrike === contract.strike
                  ? (theme.name === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                  : isATM ? theme.atm.bg : 'transparent',
              }}
              onMouseEnter={() => setHoveredStrike(contract.strike)}
              onMouseLeave={() => setHoveredStrike(null)}
            >
              {/* Call side (left) */}
              <div className="grid grid-cols-4 items-center text-xs px-1">
                <DataCell value={contract.callVolume > 0 ? contract.callVolume.toLocaleString() : '—'} theme={theme} />
                <DataCell value={contract.callIV > 0 ? `${(contract.callIV * 100).toFixed(0)}%` : '—'} theme={theme} />
                <PriceCell
                  value={contract.callAsk > 0 ? contract.callAsk.toFixed(2) : '—'}
                  onClick={() => handleCellClick(contract.strike, 'call', 'ask')}
                  clickable={contract.callAsk > 0}
                  selected={isLegSelected(contract.strike, 'call', 'ask')}
                  theme={theme}
                  type="buy"
                />
                <PriceCell
                  value={contract.callBid > 0 ? contract.callBid.toFixed(2) : '—'}
                  onClick={() => handleCellClick(contract.strike, 'call', 'bid')}
                  clickable={contract.callBid > 0}
                  selected={isLegSelected(contract.strike, 'call', 'bid')}
                  theme={theme}
                  type="sell"
                />
              </div>

              {/* Strike (center, large) */}
              <div
                className="flex items-center justify-center font-bold text-base py-1.5"
                style={{ color: isATM ? theme.atm.text : theme.text.primary }}
              >
                {contract.strike.toFixed(0)}
              </div>

              {/* Put side (right) */}
              <div className="grid grid-cols-4 items-center text-xs px-1">
                <PriceCell
                  value={contract.putBid > 0 ? contract.putBid.toFixed(2) : '—'}
                  onClick={() => handleCellClick(contract.strike, 'put', 'bid')}
                  clickable={contract.putBid > 0}
                  selected={isLegSelected(contract.strike, 'put', 'bid')}
                  theme={theme}
                  type="sell"
                />
                <PriceCell
                  value={contract.putAsk > 0 ? contract.putAsk.toFixed(2) : '—'}
                  onClick={() => handleCellClick(contract.strike, 'put', 'ask')}
                  clickable={contract.putAsk > 0}
                  selected={isLegSelected(contract.strike, 'put', 'ask')}
                  theme={theme}
                  type="buy"
                />
                <DataCell value={contract.putIV > 0 ? `${(contract.putIV * 100).toFixed(0)}%` : '—'} theme={theme} />
                <DataCell value={contract.putVolume > 0 ? contract.putVolume.toLocaleString() : '—'} theme={theme} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataCell({ value, theme }: { value: string; theme: import('../themes').Theme }) {
  return (
    <span className="text-center font-mono py-1.5" style={{ color: theme.text.muted }}>
      {value}
    </span>
  );
}

function PriceCell({
  value,
  onClick,
  clickable,
  selected,
  type,
  theme,
}: {
  value: string;
  onClick: () => void;
  clickable: boolean;
  selected: boolean;
  type: 'buy' | 'sell';
  theme: import('../themes').Theme;
}) {
  if (!clickable) {
    return (
      <span className="text-center font-mono py-1.5" style={{ color: theme.text.faint }}>—</span>
    );
  }

  const colors = type === 'buy' ? theme.buy : theme.sell;

  return (
    <button
      onClick={onClick}
      className="text-center font-mono font-medium py-1.5 mx-0.5 rounded cursor-pointer transition-all"
      style={{
        background: selected ? colors.bgSelected : colors.bg,
        color: colors.text,
        outline: selected ? `1px solid ${colors.border}` : 'none',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = colors.bgHover; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = colors.bg; }}
    >
      {value}
    </button>
  );
}
