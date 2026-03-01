import { useState } from 'react';
import type { Scan } from '../types';
import { Trash2, Save, Edit3 } from 'lucide-react';

interface Props {
  scan: Scan;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Scan>) => void;
}

const sections = [
  {
    title: 'Body Composition',
    fields: [
      { key: 'total_body_water', label: 'Total Body Water', unit: 'L' },
      { key: 'protein', label: 'Protein', unit: 'kg' },
      { key: 'minerals', label: 'Minerals', unit: 'kg' },
      { key: 'body_fat_mass', label: 'Body Fat Mass', unit: 'kg' },
      { key: 'weight', label: 'Weight', unit: 'kg' },
    ],
  },
  {
    title: 'Muscle-Fat Analysis',
    fields: [
      { key: 'smm', label: 'Skeletal Muscle Mass', unit: 'kg' },
      { key: 'weight', label: 'Weight', unit: 'kg' },
      { key: 'body_fat_mass', label: 'Body Fat Mass', unit: 'kg' },
    ],
  },
  {
    title: 'Obesity Analysis',
    fields: [
      { key: 'bmi', label: 'BMI', unit: 'kg/m²' },
      { key: 'pbf', label: 'Percent Body Fat', unit: '%' },
    ],
  },
  {
    title: 'Weight Control',
    fields: [
      { key: 'target_weight', label: 'Target Weight', unit: 'kg' },
      { key: 'weight_control', label: 'Weight Control', unit: 'kg' },
      { key: 'fat_control', label: 'Fat Control', unit: 'kg' },
      { key: 'muscle_control', label: 'Muscle Control', unit: 'kg' },
    ],
  },
  {
    title: 'Research Parameters',
    fields: [
      { key: 'waist_hip_ratio', label: 'Waist-Hip Ratio', unit: '' },
      { key: 'visceral_fat_level', label: 'Visceral Fat Level', unit: '' },
      { key: 'fat_free_mass', label: 'Fat Free Mass', unit: 'kg' },
      { key: 'basal_metabolic_rate', label: 'Basal Metabolic Rate', unit: 'kcal' },
      { key: 'obesity_degree', label: 'Obesity Degree', unit: '%' },
      { key: 'smi', label: 'SMI', unit: 'kg/m²' },
      { key: 'recommended_calories', label: 'Recommended Calories', unit: 'kcal' },
    ],
  },
];

const segmentLabels = ['Right Arm', 'Left Arm', 'Trunk', 'Right Leg', 'Left Leg'];
const segmentKeys = ['RA', 'LA', 'TR', 'RL', 'LL'];

function parseSegmentalJson(raw: string | undefined): Record<string, number> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}
  return null;
}

function SegmentalTable({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {segmentKeys.map((k, i) => (
                <th key={k} className="text-center text-gray-500 font-medium pb-2 px-2">
                  {segmentLabels[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {segmentKeys.map((k) => (
                <td key={k} className="text-center text-gray-900 font-medium py-1 px-2">
                  {data[k] != null ? data[k] : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImpedanceTable({ data }: { data: Record<string, number> }) {
  const freqs = ['Z20', 'Z100', 'Z_ratio'];
  const freqLabels: Record<string, string> = {
    Z20: '20 kHz',
    Z100: '100 kHz',
    Z_ratio: 'Ratio',
  };

  // Detect which frequency keys actually exist
  const allKeys = Object.keys(data);
  const segments = segmentKeys;

  // Try to figure out the structure: could be flat like RA_Z20, or nested, or just segment keys
  const hasFreqKeys = allKeys.some((k) => k.includes('_Z'));

  if (hasFreqKeys) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Impedance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-2 px-2">Frequency</th>
                {segments.map((s, i) => (
                  <th key={s} className="text-center text-gray-500 font-medium pb-2 px-2">
                    {segmentLabels[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {freqs.map((f) => (
                <tr key={f} className="border-t border-gray-100">
                  <td className="text-gray-600 py-1.5 px-2">{freqLabels[f] ?? f}</td>
                  {segments.map((s) => (
                    <td key={s} className="text-center text-gray-900 font-medium py-1.5 px-2">
                      {data[`${s}_${f}`] != null ? data[`${s}_${f}`] : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: just render all key-value pairs
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">Impedance</h3>
      <div className="space-y-1.5">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">{k.replace(/_/g, ' ')}</span>
            <span className="text-gray-900 font-medium text-sm">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScanDetail({ scan, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const startEdit = () => {
    setEditing(true);
    setEdits({});
  };

  const saveEdits = () => {
    const data: Record<string, number | string | null> = {};
    for (const [key, val] of Object.entries(edits)) {
      if (val === '') {
        data[key] = null;
      } else {
        const num = parseFloat(val);
        data[key] = isNaN(num) ? val : num;
      }
    }
    onUpdate(scan.id, data);
    setEditing(false);
  };

  const getValue = (key: string) => {
    if (editing && key in edits) return edits[key];
    const v = (scan as any)[key];
    return v != null ? String(v) : '';
  };

  const segmentalLean = parseSegmentalJson(scan.segmental_lean);
  const segmentalFat = parseSegmentalJson(scan.segmental_fat);
  const impedance = parseSegmentalJson(scan.impedance);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {scan.test_date}
          </h2>
          <div className="flex gap-4 text-sm text-gray-500 mt-1">
            {scan.patient_name && <span>{scan.patient_name}</span>}
            {scan.patient_id && <span>ID: {scan.patient_id}</span>}
            {scan.height_cm && <span>{scan.height_cm} cm</span>}
            {scan.age && <span>Age {scan.age}</span>}
            {scan.gender && <span>{scan.gender}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <button
              onClick={saveEdits}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg"
            >
              <Save size={14} /> Save
            </button>
          ) : (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"
            >
              <Edit3 size={14} /> Edit
            </button>
          )}
          <button
            onClick={() => { if (confirm('Delete this scan?')) onDelete(scan.id); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* 2. InBody Score hero */}
      {scan.inbody_score != null && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="text-sm text-emerald-600 mb-1">InBody Score</div>
          <div className="text-5xl font-bold text-gray-900">{scan.inbody_score}</div>
          <div className="text-gray-400 text-sm">/100</div>
        </div>
      )}

      {/* 3. Body Composition Bar */}
      {scan.weight && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Body Composition Breakdown</h3>
          <CompositionBar scan={scan} />
        </div>
      )}

      {/* 4–7. Metric Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <h3 className="text-sm font-medium text-gray-600 mb-3">{section.title}</h3>
            <div className="space-y-2">
              {section.fields.map((f) => (
                <div key={f.key + f.label} className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{f.label}</span>
                  {editing ? (
                    <input
                      type="text"
                      value={getValue(f.key)}
                      onChange={(e) => setEdits({ ...edits, [f.key]: e.target.value })}
                      className="w-24 text-right bg-gray-50 text-gray-900 text-sm px-2 py-1 rounded border border-gray-300 focus:border-emerald-500 focus:outline-none"
                      placeholder="—"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium text-sm">
                      {getValue(f.key) || '—'}
                      {getValue(f.key) && f.unit && (
                        <span className="text-gray-400 ml-1">{f.unit}</span>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 8. Segmental Lean / Fat tables */}
      {segmentalLean && <SegmentalTable title="Segmental Lean Analysis" data={segmentalLean} />}
      {segmentalFat && <SegmentalTable title="Segmental Fat Analysis" data={segmentalFat} />}

      {/* 9. Impedance table */}
      {impedance && <ImpedanceTable data={impedance} />}
    </div>
  );
}

function CompositionBar({ scan }: { scan: Scan }) {
  const parts = [
    { label: 'Water', value: scan.total_body_water, color: 'bg-cyan-500' },
    { label: 'Protein', value: scan.protein, color: 'bg-emerald-500' },
    { label: 'Minerals', value: scan.minerals, color: 'bg-amber-500' },
    { label: 'Fat', value: scan.body_fat_mass, color: 'bg-orange-500' },
  ].filter((p) => p.value);

  const total = parts.reduce((s, p) => s + (p.value || 0), 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden h-8">
        {parts.map((p) => (
          <div
            key={p.label}
            className={`${p.color} flex items-center justify-center text-xs font-medium text-white`}
            style={{ width: `${((p.value || 0) / total) * 100}%` }}
          >
            {((p.value || 0) / total * 100).toFixed(0)}%
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${p.color}`} />
            {p.label}: {p.value} kg
          </div>
        ))}
      </div>
    </div>
  );
}
