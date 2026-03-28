import type { OptionLeg, OptionType, Position, Strategy } from '../types';
import { useTheme } from '../ThemeContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatExp(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

interface Props {
  legs: OptionLeg[];
  strategy: Strategy | null;
  onRemoveLeg: (legId: string) => void;
  onUpdateLeg: (legId: string, updates: Partial<Pick<OptionLeg, 'type' | 'position' | 'quantity'>>) => void;
  onChangeStrike: (legId: string, direction: -1 | 1) => void;
  onChangeExpiration: (legId: string, direction: -1 | 1) => void;
}

export default function StrategySummary({ legs, strategy, onRemoveLeg, onUpdateLeg, onChangeStrike, onChangeExpiration }: Props) {
  const { theme } = useTheme();

  const netDelta = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? 1 : -1;
    return sum + sign * leg.delta * leg.quantity;
  }, 0);

  const netGamma = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? 1 : -1;
    return sum + sign * leg.gamma * leg.quantity;
  }, 0);

  const netTheta = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? 1 : -1;
    return sum + sign * leg.theta * leg.quantity;
  }, 0);

  const netVega = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? 1 : -1;
    return sum + sign * leg.vega * leg.quantity;
  }, 0);

  const netDebit = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? -1 : 1;
    return sum + sign * leg.premium * leg.quantity * 100;
  }, 0);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.text.secondary }}>
        Position Summary
      </h3>

      {legs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: theme.text.muted }}>
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke={theme.text.faint}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p>Click strikes below to build your position</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Legs */}
          <div className="space-y-2 mb-3">
            {legs.map((leg) => (
              <div
                key={leg.id}
                className="rounded-lg border p-2.5"
                style={{ background: theme.card.bg, borderColor: theme.card.border }}
              >
                {/* Row 1: Strike + delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => onChangeStrike(leg.id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded-l text-xs font-bold transition-colors cursor-pointer"
                      style={{ background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      -
                    </button>
                    <span
                      className="px-4 h-6 flex items-center justify-center text-sm font-bold font-mono"
                      style={{ background: theme.input.bg, color: theme.text.primary,
                        borderTop: `1px solid ${theme.input.border}`, borderBottom: `1px solid ${theme.input.border}` }}
                    >
                      ${leg.strike.toFixed(0)}
                    </span>
                    <button
                      onClick={() => onChangeStrike(leg.id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-r text-xs font-bold transition-colors cursor-pointer"
                      style={{ background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-mono" style={{ paddingRight:`5px`, color: theme.text.primary }}>
                      {formatExp(leg.expiration)}
                    </span>
                    <button
                      onClick={() => onChangeExpiration(leg.id, -1)}
                      className="w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold transition-colors cursor-pointer"
                      style={{ margin:`0`, background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      -
                    </button>
                    <button
                      onClick={() => onChangeExpiration(leg.id, 1)}
                      className="w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold transition-colors cursor-pointer"
                      style={{  margin:`0`,background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveLeg(leg.id)}
                      className="transition-colors cursor-pointer"
                      style={{ color: theme.text.muted }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Row 2: Buy/Sell + Call/Put toggles */}
                <div className="flex gap-1.5 mb-2">
                  {(['long', 'short'] as Position[]).map((pos) => {
                    const isActive = leg.position === pos;
                    const colors = pos === 'long' ? theme.buy : theme.sell;
                    return (
                      <button
                        key={pos}
                        onClick={() => onUpdateLeg(leg.id, { position: pos })}
                        className="flex-1 text-[11px] font-medium py-1 rounded transition-all cursor-pointer"
                        style={{
                          background: isActive ? colors.bgSelected : theme.button.bg,
                          color: isActive ? colors.text : theme.text.muted,
                          outline: isActive ? `1px solid ${colors.border}` : `1px solid ${theme.button.border}`,
                        }}
                      >
                        {pos === 'long' ? 'Buy' : 'Sell'}
                      </button>
                    );
                  })}
                  {(['call', 'put'] as OptionType[]).map((t) => {
                    const isActive = leg.type === t;
                    const colors = t === 'call' ? theme.call : theme.put;
                    return (
                      <button
                        key={t}
                        onClick={() => onUpdateLeg(leg.id, { type: t })}
                        className="flex-1 text-[11px] font-medium py-1 rounded transition-all cursor-pointer"
                        style={{
                          background: isActive ? colors.bgSelected : theme.button.bg,
                          color: isActive ? colors.text : theme.text.muted,
                          outline: isActive ? `1px solid ${colors.border}` : `1px solid ${theme.button.border}`,
                        }}
                      >
                        {t === 'call' ? 'Call' : 'Put'}
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: Price + Qty + Delta */}
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: theme.text.secondary }}>
                    Price <span className="font-mono font-medium" style={{ color: theme.text.primary }}>
                      ${leg.premium.toFixed(2)}
                    </span>
                  </span>
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => onUpdateLeg(leg.id, { quantity: Math.max(1, leg.quantity - 1) })}
                      className="w-6 h-6 flex items-center justify-center rounded-l text-xs font-bold transition-colors cursor-pointer"
                      style={{ background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      -
                    </button>
                    <span
                      className="w-8 h-6 flex items-center justify-center text-[11px] font-mono"
                      style={{ background: theme.input.bg, color: theme.text.primary, borderTop: `1px solid ${theme.input.border}`, borderBottom: `1px solid ${theme.input.border}` }}
                    >
                      {leg.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateLeg(leg.id, { quantity: Math.min(100, leg.quantity + 1) })}
                      className="w-6 h-6 flex items-center justify-center rounded-r text-xs font-bold transition-colors cursor-pointer"
                      style={{ background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ color: theme.text.secondary }}>
                    <span
                      className="font-mono"
                      style={{ color: leg.delta !== 0 ? (leg.delta > 0 ? theme.spot.positive : theme.spot.negative) : theme.text.muted }}
                    >
                      {leg.delta !== 0 ? `${leg.delta > 0 ? '+' : ''}${leg.delta.toFixed(3)}` : '—'}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Greeks */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Delta', value: netDelta },
              { label: 'Gamma', value: netGamma },
              { label: 'Theta', value: netTheta },
              { label: 'Vega', value: netVega },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-2 text-center border"
                style={{ background: theme.card.bg, borderColor: theme.card.border }}
              >
                <div className="text-[10px] uppercase tracking-wider" style={{ color: theme.text.muted }}>{label}</div>
                <div
                  className="text-sm font-bold font-mono"
                  style={{ color: value >= 0 ? theme.spot.positive : theme.spot.negative }}
                >
                  {value >= 0 ? '+' : ''}{value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>

          {/* Net cost */}
          <div className="rounded-lg p-3 border" style={{ background: theme.card.bg, borderColor: theme.card.border }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: theme.text.secondary }}>
                Net {netDebit > 0 ? 'Credit' : 'Debit'}
              </span>
              <span
                className="text-lg font-bold font-mono"
                style={{ color: netDebit > 0 ? theme.spot.positive : theme.spot.negative }}
              >
                ${Math.abs(netDebit).toFixed(2)}
              </span>
            </div>
            {strategy && (
              <div className="mt-2 pt-2 grid grid-cols-3 gap-2 text-[10px]" style={{ borderTop: `1px solid ${theme.app.border}` }}>
                <div>
                  <div style={{ color: theme.text.muted }}>Max Profit</div>
                  <div style={{ color: theme.text.primary }}>{strategy.maxProfit}</div>
                </div>
                <div>
                  <div style={{ color: theme.text.muted }}>Max Loss</div>
                  <div style={{ color: theme.text.primary }}>{strategy.maxLoss}</div>
                </div>
                <div>
                  <div style={{ color: theme.text.muted }}>Breakeven</div>
                  <div style={{ color: theme.text.primary }}>{strategy.breakeven}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
