import type { MarketOutlook, Strategy } from '../types';

const outlookColors: Record<MarketOutlook, { bg: string; active: string; text: string }> = {
  bullish: { bg: 'bg-emerald-500/10', active: 'bg-emerald-500', text: 'text-emerald-400' },
  bearish: { bg: 'bg-red-500/10', active: 'bg-red-500', text: 'text-red-400' },
  neutral: { bg: 'bg-blue-500/10', active: 'bg-blue-500', text: 'text-blue-400' },
  volatile: { bg: 'bg-amber-500/10', active: 'bg-amber-500', text: 'text-amber-400' },
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
  const filteredStrategies = selectedOutlook
    ? strategies.filter((s) => s.outlook.includes(selectedOutlook))
    : strategies;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Market Outlook</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(outlookLabels) as MarketOutlook[]).map((outlook) => {
            const colors = outlookColors[outlook];
            const isActive = selectedOutlook === outlook;
            return (
              <button
                key={outlook}
                onClick={() => onSelectOutlook(isActive ? null : outlook)}
                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? `${colors.active} text-white border-transparent shadow-lg`
                    : `${colors.bg} ${colors.text} border-transparent hover:border-gray-600`
                }`}
              >
                {outlookLabels[outlook]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Strategies ({filteredStrategies.length})
        </h3>
        <div className="space-y-1">
          {filteredStrategies.map((strategy) => {
            const isSelected = selectedStrategy?.id === strategy.id;
            return (
              <button
                key={strategy.id}
                onClick={() => onSelectStrategy(strategy)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                    : 'bg-gray-800/50 border-transparent hover:bg-gray-700/50 hover:border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{strategy.name}</span>
                  <div className="flex gap-1">
                    {strategy.outlook.map((o) => (
                      <span
                        key={o}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${outlookColors[o].bg} ${outlookColors[o].text}`}
                      >
                        {outlookLabels[o]}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{strategy.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
