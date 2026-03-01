import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import type { TrendPoint, Goals } from '../types';
import { useT } from '../lib/i18n';

interface Props {
  trends: TrendPoint[];
  goals: Goals;
}

export function TrendCharts({ trends, goals }: Props) {
  const { locale, t } = useT();

  const chartConfigs = [
    {
      title: t('chart.weightMuscle'),
      lines: [
        { key: 'weight', color: '#3b82f6', name: t('chart.weightKg') },
        { key: 'smm', color: '#10b981', name: t('chart.smmKg') },
        { key: 'body_fat_mass', color: '#f97316', name: t('chart.fatMassKg') },
      ],
      goalKey: 'target_weight' as const,
      goalLabel: t('chart.goal'),
    },
    {
      title: t('chart.fatBmi'),
      lines: [
        { key: 'pbf', color: '#f97316', name: t('chart.pbfPercent') },
        { key: 'bmi', color: '#8b5cf6', name: t('chart.bmi') },
      ],
      goalKey: 'target_pbf' as const,
      goalLabel: t('chart.goal'),
    },
  ];
  const hasEnoughData = trends.length >= 2;

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', { month: 'short', year: 'numeric' });
  };

  const data = trends.map((t) => ({
    ...t,
    date: formatDate(t.test_date),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {chartConfigs.map((cfg) => {
        const goalValue = goals[cfg.goalKey];
        return (
          <div
            key={cfg.title}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <h3 className="text-sm font-medium text-gray-600 mb-3">{cfg.title}</h3>
            {hasEnoughData ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Legend />
                  {goalValue != null && (
                    <ReferenceLine
                      y={goalValue}
                      stroke="#10b981"
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      label={{
                        value: `${cfg.goalLabel}: ${goalValue}`,
                        position: 'right',
                        fill: '#10b981',
                        fontSize: 11,
                      }}
                    />
                  )}
                  {cfg.lines.map((l) => (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      stroke={l.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={l.name}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                {t('chart.needMore')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
