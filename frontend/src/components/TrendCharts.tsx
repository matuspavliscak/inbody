import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import type { TrendPoint, Goals } from '../types';

interface Props {
  trends: TrendPoint[];
  goals: Goals;
}

const chartConfigs = [
  {
    title: 'Weight & Muscle',
    lines: [
      { key: 'weight', color: '#3b82f6', name: 'Weight (kg)' },
      { key: 'smm', color: '#10b981', name: 'SMM (kg)' },
      { key: 'body_fat_mass', color: '#f97316', name: 'Fat Mass (kg)' },
    ],
    goalKey: 'target_weight' as const,
    goalLabel: 'Goal',
  },
  {
    title: 'Body Fat % & BMI',
    lines: [
      { key: 'pbf', color: '#f97316', name: 'PBF (%)' },
      { key: 'bmi', color: '#8b5cf6', name: 'BMI' },
    ],
    goalKey: 'target_pbf' as const,
    goalLabel: 'Goal',
  },
];

export function TrendCharts({ trends, goals }: Props) {
  const hasEnoughData = trends.length >= 2;

  const data = trends.map((t) => ({
    ...t,
    date: t.test_date.slice(5), // MM-DD for shorter labels
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
                Need at least 2 scans to show trends
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
