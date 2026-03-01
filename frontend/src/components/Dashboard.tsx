import { useState, useRef } from 'react';
import type { ScanSummary, TrendPoint, Goals } from '../types';
import { TrendCharts } from './TrendCharts';
import { Activity, Scale, Dumbbell, Percent, Target, Trash2, Download, Goal, XCircle, Upload } from 'lucide-react';
import { Tip } from './Tip';
import { ConfirmModal } from './ConfirmModal';
import { btn } from '../lib/styles';

interface Props {
  scans: ScanSummary[];
  trends: TrendPoint[];
  goals: Goals;
  onSelectScan: (id: number) => void;
  onDeleteScan: (id: number) => void;
  onSaveGoals: (goals: Goals) => void;
  onSeedSample: () => void;
  onClearAll: () => void;
  onNotify?: (message: string) => void;
  onUpload?: (files: File[]) => void;
  onInvalidFiles?: (names: string[]) => void;
}

type ConfirmAction = { title: string; message: string; onConfirm: () => void } | null;

function StatCard({ label, value, unit, icon: Icon, color, tip }: {
  label: string; value?: number | string; unit?: string;
  icon: React.ElementType; color: string; tip?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
        <Icon size={14} className={color} />
        {tip ? <Tip term={tip}>{label}</Tip> : label}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value ?? '—'}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function GoalsBar({ goals, onSave }: { goals: Goals; onSave: (g: Goals) => void }) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(goals.target_weight?.toString() ?? '');
  const [pbf, setPbf] = useState(goals.target_pbf?.toString() ?? '');

  const handleSave = () => {
    onSave({
      target_weight: weight ? parseFloat(weight) : null,
      target_pbf: pbf ? parseFloat(pbf) : null,
    });
    setEditing(false);
  };

  const hasGoals = goals.target_weight != null || goals.target_pbf != null;

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
        <Goal size={16} className="text-emerald-600 shrink-0" />
        {hasGoals ? (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {goals.target_weight != null && (
              <span className="text-gray-700">Target weight: <strong>{goals.target_weight} kg</strong></span>
            )}
            {goals.target_pbf != null && (
              <span className="text-gray-700">Target body fat: <strong>{goals.target_pbf}%</strong></span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">No goals set</span>
        )}
        <button
          onClick={() => {
            setWeight(goals.target_weight?.toString() ?? '');
            setPbf(goals.target_pbf?.toString() ?? '');
            setEditing(true);
          }}
          className={`ml-auto ${btn.ghost}`}
        >
          {hasGoals ? 'Edit' : 'Set goals'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
      <Goal size={16} className="text-emerald-600 shrink-0" />
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">Weight</label>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="kg"
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">Body Fat %</label>
        <input
          type="number"
          step="0.1"
          value={pbf}
          onChange={(e) => setPbf(e.target.value)}
          placeholder="%"
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <button onClick={handleSave} className={`ml-auto ${btn.primary}`}>
        Save
      </button>
      <button onClick={() => setEditing(false)} className={btn.ghost}>
        Cancel
      </button>
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

export function Dashboard({ scans, trends, goals, onSelectScan, onDeleteScan, onSaveGoals, onSeedSample, onClearAll, onNotify, onUpload, onInvalidFiles }: Props) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const latest = scans[0];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const all = Array.from(fileList);
    const valid = all.filter((f) => f.type === 'application/pdf' || f.type.startsWith('image/'));
    const invalid = all.filter((f) => f.type !== 'application/pdf' && !f.type.startsWith('image/'));
    if (invalid.length > 0) onInvalidFiles?.(invalid.map((f) => f.name));
    if (valid.length > 0) onUpload?.(valid);
  };

  if (scans.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files); }}
          className={`mx-auto max-w-md border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
        >
          <Upload size={32} className="mx-auto mb-3 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Drop InBody scans here</h2>
          <p className="text-sm text-gray-400">PDF or image files — click to browse</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-400">
          <span className="h-px w-12 bg-gray-200" />
          or
          <span className="h-px w-12 bg-gray-200" />
        </div>
        <button onClick={onSeedSample} className={`mt-4 ${btn.ghost}`}>
          Load sample data to explore
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goals */}
      <GoalsBar goals={goals} onSave={onSaveGoals} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard label="Weight" value={latest?.weight} unit="kg" icon={Scale} color="text-blue-500" />
        <StatCard label="SMM" value={latest?.smm} unit="kg" icon={Dumbbell} color="text-emerald-500" tip="SMM" />
        <StatCard label="Body Fat %" value={latest?.pbf} unit="%" icon={Percent} color="text-orange-500" tip="PBF" />
        <StatCard label="BMI" value={latest?.bmi} icon={Activity} color="text-purple-500" tip="BMI" />
        <StatCard label="InBody Score" value={latest?.inbody_score} unit="/100" icon={Target} color="text-yellow-500" tip="InBody" />
      </div>

      {/* Trend charts */}
      <TrendCharts trends={trends} goals={goals} />

      {/* Scan list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">All Scans</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportToCsv(scans);
                onNotify?.('CSV exported');
              }}
              className={btn.secondary}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setConfirmAction({
                title: 'Clear all data',
                message: 'Delete all scans and goals? This cannot be undone.',
                onConfirm: onClearAll,
              })}
              className={btn.danger}
            >
              <XCircle size={14} />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {scans.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => onSelectScan(s.id)}
                className="flex-1 min-w-0 text-left bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 mr-4">
                    <span className="text-gray-900 font-medium">{s.test_date}</span>
                    <span className="text-gray-400 text-sm ml-3 truncate inline-block max-w-[140px] align-bottom">{s.source_file}</span>
                  </div>
                  <div className="flex gap-4 text-sm shrink-0">
                    {s.weight && <span className="text-gray-600">{s.weight} <span className="text-gray-400">kg</span></span>}
                    {s.smm && <span className="text-gray-600 hidden sm:inline"><Tip term="SMM">SMM</Tip> {s.smm}</span>}
                    {s.pbf && <span className="text-gray-600 hidden md:inline"><Tip term="PBF">PBF</Tip> {s.pbf}<span className="text-gray-400">%</span></span>}
                    {s.inbody_score && <span className="text-gray-600">Score {s.inbody_score}</span>}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setConfirmAction({
                  title: 'Delete scan',
                  message: `Delete scan from ${s.test_date}? This cannot be undone.`,
                  onConfirm: () => onDeleteScan(s.id),
                })}
                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                aria-label={`Delete scan from ${s.test_date}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => { confirmAction?.onConfirm(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
