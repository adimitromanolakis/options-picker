import { useMemo, useState, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { OptionLeg } from '../types';
import { stockInfo } from '../data';
import { useTheme } from '../ThemeContext';

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

const RANGE_OFFSET = 50;
const STEP = 0.2;

export default function PayoffDiagram({ legs }: Props) {
  const { theme } = useTheme();
  const spot = stockInfo.price;
  const roundedSpot = Math.round(spot);
  const chartRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startMin: number; startMax: number } | null>(null);

  const fullData = useMemo((): DataPoint[] => {
    const min = roundedSpot - RANGE_OFFSET;
    const max = roundedSpot + RANGE_OFFSET;
    const points: DataPoint[] = [];
    for (let p = min; p <= max + STEP / 2; p += STEP) {
      const price = Math.round(p * 10) / 10;
      points.push({
        price,
        pnl: Math.round(calculatePayoff(legs, price) * 100) / 100,
      });
    }
    return points;
  }, [legs, roundedSpot]);

  const defaultMin = roundedSpot - RANGE_OFFSET;
  const defaultMax = roundedSpot + RANGE_OFFSET;
  const [xDomain, setXDomain] = useState<[number, number]>([defaultMin, defaultMax]);

  const resetView = useCallback(() => {
    setXDomain([defaultMin, defaultMax]);
  }, [defaultMin, defaultMax]);

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
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text.secondary }}>
          Payoff at Expiration
        </h3>
        <div className="flex items-center gap-3">
          {legs.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span style={{ color: theme.text.muted }}>
                Net: <span style={{ color: totalPremium >= 0 ? theme.spot.positive : theme.spot.negative }}>
                  {totalPremium >= 0 ? '+' : ''}${totalPremium.toFixed(2)}
                </span>
              </span>
              <span style={{ color: theme.text.muted }}>
                Max P: <span style={{ color: theme.spot.positive }}>${maxProfit.toFixed(0)}</span>
              </span>
              <span style={{ color: theme.text.muted }}>
                Max L: <span style={{ color: theme.spot.negative }}>${maxLoss.toFixed(0)}</span>
              </span>
            </div>
          )}
          {isZoomed && (
            <button
              onClick={resetView}
              className="text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer"
              style={{ background: theme.button.bg, color: theme.text.secondary, border: `1px solid ${theme.button.border}` }}
            >
              Reset View
            </button>
          )}
          <span className="text-[10px]" style={{ color: theme.text.faint }}>Scroll to zoom · Drag to pan</span>
        </div>
      </div>

      <div
        ref={chartRef}
        className="rounded-lg border p-2 cursor-grab active:cursor-grabbing"
        style={{ height: 'calc(100% - 28px)', background: theme.chart.bg, borderColor: theme.app.border }}
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
                <stop offset="5%" stopColor={theme.buy.text} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.buy.text} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.chart.grid} />
            <XAxis
              dataKey="price"
              tick={{ fill: theme.text.muted, fontSize: 10 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke={theme.app.borderLight}
              type="number"
              domain={xDomain}
              tickCount={10}
              allowDataOverflow
            />
            <YAxis
              tick={{ fill: theme.text.muted, fontSize: 10 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke={theme.app.borderLight}
              domain={[minPnl - pnlRange * 0.1, maxPnl + pnlRange * 0.1]}
            />
            <Tooltip
              contentStyle={{
                background: theme.app.headerBg,
                border: `1px solid ${theme.app.borderLight}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: theme.text.primary,
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'P&L']}
              labelFormatter={(label) => `Price: $${Number(label).toFixed(2)}`}
            />
            <ReferenceLine
              x={roundedSpot}
              stroke={theme.chart.line}
              strokeDasharray="5 5"
              label={{ value: `SPOT $${roundedSpot}`, fill: theme.chart.line, fontSize: 10, position: 'top' }}
            />
            <ReferenceLine y={0} stroke={theme.chart.zero} />
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
                stroke={leg.type === 'call' ? theme.buy.text : theme.sell.text}
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            ))}
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={theme.chart.line}
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
