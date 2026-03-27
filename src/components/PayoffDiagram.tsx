import { useMemo, useState, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { OptionLeg } from '../types';
import { stockInfo } from '../data';

interface Props {
  legs: OptionLeg[];
}

function calculatePayoff(legs: OptionLeg[], price: number): number {
  let totalPayoff = 0;
  for (const leg of legs) {
    const intrinsic = leg.type === 'call'
      ? Math.max(0, price - leg.strike)
      : Math.max(0, leg.strike - price);

    if (leg.position === 'long') {
      totalPayoff += (intrinsic - leg.premium) * leg.quantity * 100;
    } else {
      totalPayoff += (leg.premium - intrinsic) * leg.quantity * 100;
    }
  }
  return totalPayoff;
}

interface DataPoint {
  price: number;
  pnl: number;
}

const FULL_RANGE_PCT = 0.3;
const STEP_PCT = 0.002;

export default function PayoffDiagram({ legs }: Props) {
  const spot = stockInfo.price;
  const chartRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startMin: number; startMax: number } | null>(null);

  // Full data — always the same range regardless of legs
  const fullData = useMemo((): DataPoint[] => {
    const range = spot * FULL_RANGE_PCT;
    const min = spot - range;
    const max = spot + range;
    const points: DataPoint[] = [];
    for (let p = min; p <= max; p += range * STEP_PCT / FULL_RANGE_PCT) {
      points.push({
        price: Math.round(p * 100) / 100,
        pnl: Math.round(calculatePayoff(legs, p) * 100) / 100,
      });
    }
    return points;
  }, [legs, spot]);

  // Visible x range — user controlled
  const defaultMin = spot - spot * FULL_RANGE_PCT;
  const defaultMax = spot + spot * FULL_RANGE_PCT;
  const [xDomain, setXDomain] = useState<[number, number]>([defaultMin, defaultMax]);

  // Reset view to full range
  const resetView = useCallback(() => {
    setXDomain([defaultMin, defaultMax]);
  }, [defaultMin, defaultMax]);

  // Filter data to visible range for y-axis calc
  const visibleData = useMemo(() => {
    return fullData.filter(d => d.price >= xDomain[0] && d.price <= xDomain[1]);
  }, [fullData, xDomain]);

  const maxPnl = Math.max(...visibleData.map((d) => d.pnl), 1);
  const minPnl = Math.min(...visibleData.map((d) => d.pnl), -1);
  const pnlRange = maxPnl - minPnl || 1;

  const breakevenPrice = useMemo(() => {
    if (legs.length === 0) return null;
    for (let i = 1; i < fullData.length; i++) {
      if ((fullData[i - 1].pnl < 0 && fullData[i].pnl >= 0) || (fullData[i - 1].pnl >= 0 && fullData[i].pnl < 0)) {
        return fullData[i].price;
      }
    }
    return null;
  }, [fullData, legs]);

  const totalPremium = legs.reduce((sum, leg) => {
    const sign = leg.position === 'long' ? -1 : 1;
    return sum + sign * leg.premium * leg.quantity * 100;
  }, 0);

  const maxProfit = useMemo(() => {
    if (legs.length === 0) return 0;
    return Math.max(...visibleData.map((d) => d.pnl));
  }, [visibleData, legs]);

  const maxLoss = useMemo(() => {
    if (legs.length === 0) return 0;
    return Math.min(...visibleData.map((d) => d.pnl));
  }, [visibleData, legs]);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;

    const [min, max] = xDomain;
    const span = max - min;
    const mouseX = min + (e.clientX - rect.left) / rect.width * span;
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const newSpan = Math.max(5, Math.min(defaultMax - defaultMin, span * factor));

    const ratio = (mouseX - min) / span;
    const newMin = Math.max(defaultMin, mouseX - ratio * newSpan);
    const newMax = Math.min(defaultMax, mouseX + (1 - ratio) * newSpan);

    setXDomain([newMin, newMax]);
  }, [xDomain, defaultMin, defaultMax]);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startMin: xDomain[0], startMax: xDomain[1] };
  }, [xDomain]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const span = dragRef.current.startMax - dragRef.current.startMin;
    const dx = (e.clientX - dragRef.current.startX) / rect.width * span;
    let newMin = dragRef.current.startMin - dx;
    let newMax = dragRef.current.startMax - dx;

    // Clamp to full range
    if (newMin < defaultMin) {
      newMin = defaultMin;
      newMax = defaultMin + span;
    }
    if (newMax > defaultMax) {
      newMax = defaultMax;
      newMin = defaultMax - span;
    }

    setXDomain([newMin, newMax]);
  }, [defaultMin, defaultMax]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const isZoomed = xDomain[0] > defaultMin + 0.5 || xDomain[1] < defaultMax - 0.5;

  return (
    <div className="flex flex-col h-full select-none">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payoff at Expiration</h3>
        <div className="flex items-center gap-3">
          {legs.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="text-gray-500">
                Net: <span className={totalPremium >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {totalPremium >= 0 ? '+' : ''}${totalPremium.toFixed(2)}
                </span>
              </span>
              <span className="text-gray-500">
                Max P: <span className="text-emerald-400">${maxProfit.toFixed(0)}</span>
              </span>
              <span className="text-gray-500">
                Max L: <span className="text-red-400">${maxLoss.toFixed(0)}</span>
              </span>
            </div>
          )}
          {isZoomed && (
            <button
              onClick={resetView}
              className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700"
            >
              Reset View
            </button>
          )}
          <span className="text-[10px] text-gray-600">Scroll to zoom · Drag to pan</span>
        </div>
      </div>

      <div
        ref={chartRef}
        className="rounded-lg bg-gray-800/30 border border-gray-800 p-2 cursor-grab active:cursor-grabbing"
        style={{ height: 'calc(100% - 28px)' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fullData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="price"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke="#374151"
              type="number"
              domain={xDomain}
              tickCount={10}
              allowDataOverflow
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke="#374151"
              domain={[minPnl - pnlRange * 0.1, maxPnl + pnlRange * 0.1]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'P&L']}
              labelFormatter={(label) => `Price: $${Number(label).toFixed(2)}`}
            />
            <ReferenceLine
              x={spot}
              stroke="#6366f1"
              strokeDasharray="5 5"
              label={{ value: `SPOT $${spot}`, fill: '#6366f1', fontSize: 10, position: 'top' }}
            />
            <ReferenceLine y={0} stroke="#4b5563" />
            {breakevenPrice && (
              <ReferenceLine
                x={breakevenPrice}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: `BE $${breakevenPrice.toFixed(1)}`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {legs.map((leg) => (
              <ReferenceLine
                key={leg.id}
                x={leg.strike}
                stroke={leg.type === 'call' ? '#10b981' : '#ef4444'}
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            ))}
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#profitGradient)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
