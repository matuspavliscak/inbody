import { useState } from 'react';
import type { Scan } from '../types';
import { Trash2, Save, Edit3 } from 'lucide-react';
import { Tip } from './Tip';
import { ConfirmModal } from './ConfirmModal';
import { btn } from '../lib/styles';
import { useT } from '../lib/i18n';
import type { TranslationKey } from '../lib/translations';

interface Props {
  scan: Scan;
  previousScan?: Scan | null;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Partial<Scan>) => void;
}

// Metrics where a decrease is positive (lower is better)
const invertedMetrics = new Set(['pbf', 'bmi', 'body_fat_mass']);

// Only show deltas for these summary-level metrics
const deltaMetrics = new Set(['weight', 'smm', 'pbf', 'bmi', 'inbody_score']);

function Delta({ current, previous, invert }: { current?: number; previous?: number; invert?: boolean }) {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const positive = invert ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`text-xs font-medium ml-2 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {sign}{diff.toFixed(1)}
    </span>
  );
}

const sectionDefs: { titleKey: TranslationKey; fields: { key: string; labelKey: TranslationKey; unit: string; tip?: string }[] }[] = [
  {
    titleKey: 'section.bodyComposition',
    fields: [
      { key: 'total_body_water', labelKey: 'field.totalBodyWater', unit: 'L', tip: 'TBW' },
      { key: 'protein', labelKey: 'field.protein', unit: 'kg' },
      { key: 'minerals', labelKey: 'field.minerals', unit: 'kg' },
      { key: 'body_fat_mass', labelKey: 'field.bodyFatMass', unit: 'kg', tip: 'BFM' },
      { key: 'weight', labelKey: 'field.weight', unit: 'kg' },
    ],
  },
  {
    titleKey: 'section.muscleFat',
    fields: [
      { key: 'smm', labelKey: 'field.smm', unit: 'kg', tip: 'SMM' },
      { key: 'weight', labelKey: 'field.weight', unit: 'kg' },
      { key: 'body_fat_mass', labelKey: 'field.bodyFatMass', unit: 'kg', tip: 'BFM' },
    ],
  },
  {
    titleKey: 'section.obesity',
    fields: [
      { key: 'bmi', labelKey: 'field.bmi', unit: 'kg/m²', tip: 'BMI' },
      { key: 'pbf', labelKey: 'field.pbf', unit: '%', tip: 'PBF' },
    ],
  },
  {
    titleKey: 'section.weightControl',
    fields: [
      { key: 'target_weight', labelKey: 'field.targetWeight', unit: 'kg' },
      { key: 'weight_control', labelKey: 'field.weightControl', unit: 'kg' },
      { key: 'fat_control', labelKey: 'field.fatControl', unit: 'kg' },
      { key: 'muscle_control', labelKey: 'field.muscleControl', unit: 'kg' },
    ],
  },
  {
    titleKey: 'section.research',
    fields: [
      { key: 'waist_hip_ratio', labelKey: 'field.waistHipRatio', unit: '', tip: 'WHR' },
      { key: 'visceral_fat_level', labelKey: 'field.visceralFatLevel', unit: '', tip: 'VFL' },
      { key: 'fat_free_mass', labelKey: 'field.fatFreeMass', unit: 'kg', tip: 'FFM' },
      { key: 'basal_metabolic_rate', labelKey: 'field.basalMetabolicRate', unit: 'kcal', tip: 'BMR' },
      { key: 'obesity_degree', labelKey: 'field.obesityDegree', unit: '%' },
      { key: 'smi', labelKey: 'field.smi', unit: 'kg/m²', tip: 'SMI' },
      { key: 'recommended_calories', labelKey: 'field.recommendedCalories', unit: 'kcal' },
    ],
  },
];

const segmentLabelKeys: TranslationKey[] = ['segment.rightArm', 'segment.leftArm', 'segment.trunk', 'segment.rightLeg', 'segment.leftLeg'];
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
  const { t } = useT();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {segmentKeys.map((k, i) => (
                <th key={k} className="text-center text-gray-500 font-medium pb-2 px-2">
                  {t(segmentLabelKeys[i])}
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
  const { t } = useT();
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
        <h3 className="text-sm font-medium text-gray-600 mb-3">{t('segment.impedance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-2 px-2">{t('segment.frequency')}</th>
                {segments.map((s, i) => (
                  <th key={s} className="text-center text-gray-500 font-medium pb-2 px-2">
                    {t(segmentLabelKeys[i])}
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
      <h3 className="text-sm font-medium text-gray-600 mb-3">{t('segment.impedance')}</h3>
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

export function ScanDetail({ scan, previousScan, onDelete, onUpdate }: Props) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            {scan.patient_id && <span>{t('detail.id', { value: scan.patient_id })}</span>}
            {scan.height_cm && <span>{scan.height_cm} cm</span>}
            {scan.age && <span>{t('detail.age', { value: scan.age })}</span>}
            {scan.gender && <span>{scan.gender}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <button onClick={saveEdits} className={btn.primary}>
              <Save size={14} /> {t('detail.save')}
            </button>
          ) : (
            <button onClick={startEdit} className={btn.secondary}>
              <Edit3 size={14} /> {t('detail.edit')}
            </button>
          )}
          <button onClick={() => setShowDeleteConfirm(true)} className={btn.danger}>
            <Trash2 size={14} /> {t('detail.delete')}
          </button>
        </div>
      </div>

      {/* 2. InBody Score hero */}
      {scan.inbody_score != null && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="text-sm text-emerald-600 mb-1">{t('detail.inbodyScore')}</div>
          <div className="text-5xl font-bold text-gray-900">
            {scan.inbody_score}
            <Delta current={scan.inbody_score} previous={previousScan?.inbody_score} />
          </div>
          <div className="text-gray-400 text-sm">/100</div>
        </div>
      )}

      {/* 3. Body Composition Bar */}
      {scan.weight && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">{t('comp.breakdown')}</h3>
          <CompositionBar scan={scan} />
        </div>
      )}

      {/* 4–7. Metric Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectionDefs.map((section) => (
          <div
            key={section.titleKey}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <h3 className="text-sm font-medium text-gray-600 mb-3">{t(section.titleKey)}</h3>
            <div className="space-y-2">
              {section.fields.map((f) => (
                <div key={f.key + f.labelKey} className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">
                    {f.tip ? <Tip term={f.tip}>{t(f.labelKey)}</Tip> : t(f.labelKey)}
                  </span>
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
                      {previousScan && deltaMetrics.has(f.key) && (
                        <Delta
                          current={scan[f.key as keyof Scan] as number | undefined}
                          previous={previousScan[f.key as keyof Scan] as number | undefined}
                          invert={invertedMetrics.has(f.key)}
                        />
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
      {segmentalLean && <SegmentalTable title={t('segment.leanTitle')} data={segmentalLean} />}
      {segmentalFat && <SegmentalTable title={t('segment.fatTitle')} data={segmentalFat} />}

      {/* 9. Impedance table */}
      {impedance && <ImpedanceTable data={impedance} />}

      <ConfirmModal
        open={showDeleteConfirm}
        title={t('confirm.deleteScanTitle')}
        message={t('confirm.deleteScanMessage', { date: scan.test_date })}
        confirmLabel={t('confirm.delete')}
        confirmVariant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(scan.id); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

function CompositionBar({ scan }: { scan: Scan }) {
  const { t } = useT();
  const parts = [
    { label: t('comp.water'), value: scan.total_body_water, color: 'bg-cyan-500' },
    { label: t('comp.protein'), value: scan.protein, color: 'bg-emerald-500' },
    { label: t('comp.minerals'), value: scan.minerals, color: 'bg-amber-500' },
    { label: t('comp.fat'), value: scan.body_fat_mass, color: 'bg-orange-500' },
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
