import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import type { ScanSummary, TrendPoint, Scan, Goals } from './types';
import { Dashboard } from './components/Dashboard';
import { ScanDetail } from './components/ScanDetail';
import { UploadForm } from './components/UploadForm';
import { ToastContainer, createToast, type Toast } from './components/Toasts';
import { DashboardSkeleton, ScanDetailSkeleton } from './components/Skeleton';
import './index.css';

export default function App() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [goals, setGoals] = useState<Goals>({ target_weight: null, target_pbf: null });
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [previousScan, setPreviousScan] = useState<Scan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingScan, setLoadingScan] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    setToasts((prev) => [...prev, createToast(message, type)]);
  };
  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refresh = useCallback(async () => {
    try {
      const [s, t, g] = await Promise.all([api.listScans(), api.getTrends(), api.getGoals()]);
      setScans(s);
      setTrends(t);
      setGoals(g);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        await api.upload(files[i]);
        toast(`${files[i].name} processed successfully`);
      } catch (e: any) {
        toast(`${files[i].name}: ${e.message}`, 'error');
      }
    }
    setUploadProgress(null);
    await refresh();
    setUploading(false);
  };

  const handleInvalidFiles = (names: string[]) => {
    toast(`Skipped unsupported file${names.length > 1 ? 's' : ''}: ${names.join(', ')}`, 'error');
  };

  const handleSelectScan = async (id: number) => {
    setLoadingScan(true);
    setSelectedScan(null);
    setPreviousScan(null);
    try {
      const scan = await api.getScan(id);
      setSelectedScan(scan);
      // Find the next older scan in the list to compute deltas
      const idx = scans.findIndex((s) => s.id === id);
      if (idx >= 0 && idx < scans.length - 1) {
        try {
          const prev = await api.getScan(scans[idx + 1].id);
          setPreviousScan(prev);
        } catch {
          // silently skip if previous scan can't be loaded
        }
      }
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoadingScan(false);
    }
  };

  const handleDeleteScan = async (id: number) => {
    try {
      await api.deleteScan(id);
      if (selectedScan?.id === id) setSelectedScan(null);
      toast('Scan deleted');
      await refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleUpdateScan = async (id: number, data: Partial<Scan>) => {
    try {
      const updated = await api.updateScan(id, data);
      setSelectedScan(updated);
      toast('Scan updated');
      await refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleSaveGoals = async (g: Goals) => {
    try {
      const saved = await api.setGoals(g);
      setGoals(saved);
      toast('Goals saved');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleSeedSample = async () => {
    try {
      await api.seedSampleData();
      toast('Sample data loaded');
      await refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllScans();
      setSelectedScan(null);
      toast('All data cleared');
      await refresh();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setSelectedScan(null)}
            >
              <span className="text-emerald-600">InBody</span> Dashboard
            </h1>
            {selectedScan && (
              <button
                onClick={() => setSelectedScan(null)}
                className="text-sm text-gray-400 hover:text-gray-900"
              >
                ← Back
              </button>
            )}
          </div>
          <UploadForm onUpload={handleUpload} uploading={uploading} uploadProgress={uploadProgress} onInvalidFiles={handleInvalidFiles} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <DashboardSkeleton />
        ) : loadingScan ? (
          <ScanDetailSkeleton />
        ) : selectedScan ? (
          <ScanDetail
            scan={selectedScan}
            previousScan={previousScan}
            onDelete={handleDeleteScan}
            onUpdate={handleUpdateScan}
          />
        ) : (
          <Dashboard
            scans={scans}
            trends={trends}
            goals={goals}
            onSelectScan={handleSelectScan}
            onDeleteScan={handleDeleteScan}
            onSaveGoals={handleSaveGoals}
            onSeedSample={handleSeedSample}
            onClearAll={handleClearAll}
            onNotify={toast}
            onUpload={handleUpload}
            onInvalidFiles={handleInvalidFiles}
          />
        )}
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
