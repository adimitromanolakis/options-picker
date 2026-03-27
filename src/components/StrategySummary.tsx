import type { OptionLeg, OptionType, Position, Strategy } from '../types';

interface Props {
  legs: OptionLeg[];
  strategy: Strategy | null;
  onRemoveLeg: (legId: string) => void;
  onUpdateLeg: (legId: string, updates: Partial<Pick<OptionLeg, 'type' | 'position' | 'quantity'>>) => void;
}

export default function StrategySummary({ legs, strategy, onRemoveLeg, onUpdateLeg }: Props) {
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
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Position Summary</h3>

      {legs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="rounded-lg border border-gray-800 p-2.5 bg-gray-800/30"
              >
                {/* Row 1: Strike + delete */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white font-mono">
                    ${leg.strike.toFixed(0)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {leg.expiration}
                    </span>
                    <button
                      onClick={() => onRemoveLeg(leg.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Row 2: Buy/Sell + Call/Put toggles */}
                <div className="flex gap-1.5 mb-2">
                  {(['long', 'short'] as Position[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => onUpdateLeg(leg.id, { position: pos })}
                      className={`flex-1 text-[11px] font-medium py-1 rounded transition-all cursor-pointer border ${
                        leg.position === pos
                          ? pos === 'long'
                            ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/25 text-red-400 border-red-500/40'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {pos === 'long' ? 'Buy' : 'Sell'}
                    </button>
                  ))}
                  {(['call', 'put'] as OptionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => onUpdateLeg(leg.id, { type: t })}
                      className={`flex-1 text-[11px] font-medium py-1 rounded transition-all cursor-pointer border ${
                        leg.type === t
                          ? t === 'call'
                            ? 'bg-indigo-500/25 text-indigo-400 border-indigo-500/40'
                            : 'bg-purple-500/25 text-purple-400 border-purple-500/40'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {t === 'call' ? 'Call' : 'Put'}
                    </button>
                  ))}
                </div>

                {/* Row 3: Price + Qty + Delta */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    Price <span className="text-gray-200 font-mono font-medium">${leg.premium.toFixed(2)}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Qty</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={leg.quantity}
                      onChange={(e) => onUpdateLeg(leg.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-10 text-center bg-gray-800 border border-gray-700 rounded text-[11px] text-white py-0.5"
                    />
                  </div>
                  <span className="text-gray-400">
                    <span className={`font-mono ${leg.position === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {leg.position === 'long' ? '+' : '-'}{leg.delta.toFixed(3)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Greeks */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Delta', value: netDelta, color: netDelta >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Gamma', value: netGamma, color: netGamma >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Theta', value: netTheta, color: netTheta >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Vega', value: netVega, color: netVega >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
                <div className={`text-sm font-bold font-mono ${color}`}>
                  {value >= 0 ? '+' : ''}{value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>

          {/* Net cost */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Net {netDebit > 0 ? 'Credit' : 'Debit'}</span>
              <span className={`text-lg font-bold font-mono ${netDebit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${Math.abs(netDebit).toFixed(2)}
              </span>
            </div>
            {strategy && (
              <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <div className="text-gray-500">Max Profit</div>
                  <div className="text-gray-300 font-medium">{strategy.maxProfit}</div>
                </div>
                <div>
                  <div className="text-gray-500">Max Loss</div>
                  <div className="text-gray-300 font-medium">{strategy.maxLoss}</div>
                </div>
                <div>
                  <div className="text-gray-500">Breakeven</div>
                  <div className="text-gray-300 font-medium">{strategy.breakeven}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
