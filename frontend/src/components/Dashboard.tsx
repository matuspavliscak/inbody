import type { ScanSummary, TrendPoint } from '../types';
import { TrendCharts } from './TrendCharts';
import { Activity, Scale, Dumbbell, Percent, Target, Trash2, Download } from 'lucide-react';

interface Props {
  scans: ScanSummary[];
  trends: TrendPoint[];
  onSelectScan: (id: number) => void;
  onDeleteScan: (id: number) => void;
}

function StatCard({ label, value, unit, icon: Icon, color }: {
  label: string; value?: number | string; unit?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
        <Icon size={14} className={color} />
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value ?? '—'}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function exportToCsv(scans: ScanSummary[]) {
  const headers = ['Date', 'Weight (kg)', 'SMM (kg)', 'PBF (%)', 'BMI', 'InBody Score', 'Source File'];
  const rows = scans.map((s) => [
    s.test_date,
    s.weight ?? '',
    s.smm ?? '',
    s.pbf ?? '',
    s.bmi ?? '',
    s.inbody_score ?? '',
    s.source_file ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inbody-scans-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Dashboard({ scans, trends, onSelectScan, onDeleteScan }: Props) {
  const latest = scans[0];

  if (scans.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 opacity-30">📊</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No scans yet</h2>
        <p className="text-gray-400">Upload an InBody PDF or image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Weight" value={latest?.weight} unit="kg" icon={Scale} color="text-blue-500" />
        <StatCard label="SMM" value={latest?.smm} unit="kg" icon={Dumbbell} color="text-emerald-500" />
        <StatCard label="Body Fat %" value={latest?.pbf} unit="%" icon={Percent} color="text-orange-500" />
        <StatCard label="BMI" value={latest?.bmi} icon={Activity} color="text-purple-500" />
        <StatCard label="InBody Score" value={latest?.inbody_score} unit="/100" icon={Target} color="text-yellow-500" />
      </div>

      {/* Trend charts */}
      {trends.length > 1 && <TrendCharts trends={trends} />}

      {/* Scan list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">All Scans</h2>
          <button
            onClick={() => exportToCsv(scans)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
        <div className="space-y-2">
          {scans.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => onSelectScan(s.id)}
                className="flex-1 text-left bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-900 font-medium">{s.test_date}</span>
                    <span className="text-gray-400 text-sm ml-3">{s.source_file}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {s.weight && <span className="text-blue-600">{s.weight} kg</span>}
                    {s.smm && <span className="text-emerald-600">SMM {s.smm}</span>}
                    {s.pbf && <span className="text-orange-600">PBF {s.pbf}%</span>}
                    {s.inbody_score && <span className="text-yellow-600">Score {s.inbody_score}</span>}
                  </div>
                </div>
              </button>
              <button
                onClick={() => { if (confirm('Delete this scan?')) onDeleteScan(s.id); }}
                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Delete scan"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
