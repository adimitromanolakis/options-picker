import type { MarketOutlook, Strategy } from '../types';
import { useTheme } from '../ThemeContext';

const outlookColors: Record<MarketOutlook, { bg: string; active: string; text: string }> = {
  bullish: { bg: 'rgba(16, 185, 129, 0.10)', active: '#10b981', text: '#34d399' },
  bearish: { bg: 'rgba(239, 68, 68, 0.10)', active: '#ef4444', text: '#f87171' },
  neutral: { bg: 'rgba(59, 130, 246, 0.10)', active: '#3b82f6', text: '#60a5fa' },
  volatile: { bg: 'rgba(245, 158, 11, 0.10)', active: '#f59e0b', text: '#fbbf24' },
};

const outlookLabels: Record<MarketOutlook, string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  volatile: 'Volatile',
};

interface Props {
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  selectedOutlook: MarketOutlook | null;
  onSelectStrategy: (strategy: Strategy) => void;
  onSelectOutlook: (outlook: MarketOutlook | null) => void;
}

export default function StrategySelector({
  strategies,
  selectedStrategy,
  selectedOutlook,
  onSelectStrategy,
  onSelectOutlook,
}: Props) {
  const { theme } = useTheme();
  const filteredStrategies = selectedOutlook
    ? strategies.filter((s) => s.outlook.includes(selectedOutlook))
    : strategies;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: theme.text.secondary }}>
          Market Outlook
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(outlookLabels) as MarketOutlook[]).map((outlook) => {
            const colors = outlookColors[outlook];
            const isActive = selectedOutlook === outlook;
            return (
              <button
                key={outlook}
                onClick={() => onSelectOutlook(isActive ? null : outlook)}
                className="px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border"
                style={{
                  background: isActive ? colors.active : colors.bg,
                  color: isActive ? '#ffffff' : colors.text,
                  borderColor: 'transparent',
                }}
              >
                {outlookLabels[outlook]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.text.secondary }}>
          Strategies ({filteredStrategies.length})
        </h3>
        <div className="space-y-1">
          {filteredStrategies.map((strategy) => {
            const isSelected = selectedStrategy?.id === strategy.id;
            return (
              <button
                key={strategy.id}
                onClick={() => onSelectStrategy(strategy)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border"
                style={{
                  background: isSelected ? theme.selected.bg : theme.card.bg,
                  borderColor: isSelected ? theme.selected.border : 'transparent',
                  color: isSelected ? theme.selected.text : theme.text.primary,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{strategy.name}</span>
                  <div className="flex gap-1">
                    {strategy.outlook.map((o) => (
                      <span
                        key={o}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: outlookColors[o].bg, color: outlookColors[o].text }}
                      >
                        {outlookLabels[o]}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: theme.text.muted }}>
                  {strategy.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
