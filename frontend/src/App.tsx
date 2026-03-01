import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import type { ScanSummary, TrendPoint, Scan } from './types';
import { Dashboard } from './components/Dashboard';
import { ScanDetail } from './components/ScanDetail';
import { UploadForm } from './components/UploadForm';
import './index.css';

export default function App() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([api.listScans(), api.getTrends()]);
      setScans(s);
      setTrends(t);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      await api.upload(file);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectScan = async (id: number) => {
    try {
      const scan = await api.getScan(id);
      setSelectedScan(scan);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteScan = async (id: number) => {
    try {
      await api.deleteScan(id);
      if (selectedScan?.id === id) setSelectedScan(null);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateScan = async (id: number, data: Partial<Scan>) => {
    try {
      const updated = await api.updateScan(id, data);
      setSelectedScan(updated);
      await refresh();
    } catch (e: any) {
      setError(e.message);
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
          <UploadForm onUpload={handleUpload} uploading={uploading} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {selectedScan ? (
          <ScanDetail
            scan={selectedScan}
            onDelete={handleDeleteScan}
            onUpdate={handleUpdateScan}
          />
        ) : (
          <Dashboard
            scans={scans}
            trends={trends}
            onSelectScan={handleSelectScan}
            onDeleteScan={handleDeleteScan}
          />
        )}
      </main>
    </div>
  );
}
