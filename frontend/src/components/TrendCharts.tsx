import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { TrendPoint } from '../types';

interface Props {
  trends: TrendPoint[];
}

const chartConfigs = [
  {
    title: 'Weight & Muscle',
    lines: [
      { key: 'weight', color: '#3b82f6', name: 'Weight (kg)' },
      { key: 'smm', color: '#10b981', name: 'SMM (kg)' },
      { key: 'body_fat_mass', color: '#f97316', name: 'Fat Mass (kg)' },
    ],
  },
  {
    title: 'Body Fat % & BMI',
    lines: [
      { key: 'pbf', color: '#f97316', name: 'PBF (%)' },
      { key: 'bmi', color: '#8b5cf6', name: 'BMI' },
    ],
  },
];

export function TrendCharts({ trends }: Props) {
  const data = trends.map((t) => ({
    ...t,
    date: t.test_date.slice(5), // MM-DD for shorter labels
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {chartConfigs.map((cfg) => (
        <div
          key={cfg.title}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3">{cfg.title}</h3>
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
        </div>
      ))}
    </div>
  );
}
