import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { btn } from '../lib/styles';
import { useT } from '../lib/i18n';

interface Props {
  onUpload: (files: File[]) => void;
  uploading: boolean;
  uploadProgress?: { current: number; total: number } | null;
  onInvalidFiles?: (names: string[]) => void;
}

export function UploadForm({ onUpload, uploading, uploadProgress, onInvalidFiles }: Props) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const all = Array.from(fileList);
    const valid = all.filter(
      (f) => f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    const invalid = all.filter(
      (f) => f.type !== 'application/pdf' && !f.type.startsWith('image/')
    );
    if (invalid.length > 0) {
      onInvalidFiles?.(invalid.map((f) => f.name));
    }
    if (valid.length > 0) onUpload(valid);
  };

  const buttonLabel = uploading && uploadProgress
    ? t('upload.processingProgress', { current: uploadProgress.current, total: uploadProgress.total })
    : uploading
      ? t('upload.processing')
      : t('upload.scan');

  return (
    <div
      className={`relative ${dragOver ? 'ring-2 ring-emerald-400' : ''} rounded-lg`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
      }}
    >
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`${btn.primary} disabled:bg-gray-200 disabled:text-gray-400`}
      >
        <Upload size={16} />
        {buttonLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
