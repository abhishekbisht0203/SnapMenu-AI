import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileImage,
  Loader2,
  ScanText,
  Sparkles,
  TriangleAlert,
  UploadCloud,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Skeleton,
  cn,
  useToast,
} from '../../ui';
import { ownerApi, friendlyError, type MenuUpload } from '../../lib/api';
import { elapsed } from '../../lib/format';
import { ImportReview } from './ImportReview';
import type { SectionKey } from '../nav';

const MAX_MB = 10;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const PROCESSING_STEPS = [
  'Reading the image…',
  'Running OCR on the text…',
  'Detecting categories…',
  'Extracting items and prices…',
  'Scoring confidence…',
];

const STATUS_META: Record<MenuUpload['status'], { tone: 'info' | 'success' | 'warning' | 'danger'; label: string }> = {
  processing: { tone: 'info', label: 'Processing' },
  parsed: { tone: 'success', label: 'Ready to import' },
  needs_review: { tone: 'warning', label: 'Needs review' },
  failed: { tone: 'danger', label: 'Failed' },
};

export function ImportSection({ onNavigate }: { onNavigate: (s: SectionKey) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<MenuUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await ownerApi.get('/menu-uploads');
      setUploads(data.data);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while anything is still processing.
  useEffect(() => {
    if (!uploads.some((u) => u.status === 'processing')) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [uploads, load]);

  const submit = async (file: File) => {
    if (!ACCEPT.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WEBP or PDF.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('image', file);
    try {
      await ownerApi.post('/menu-uploads', fd, {
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
      });
      toast.success('Uploaded — AI is analysing your menu');
      load();
    } catch (e) {
      toast.error(friendlyError(e, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const reviewUpload = uploads.find((u) => u.id === reviewId) ?? null;
  if (reviewUpload) {
    return (
      <ImportReview
        upload={reviewUpload}
        onBack={() => setReviewId(null)}
        onImported={() => {
          setReviewId(null);
          load();
          toast.info('Your menu has been updated');
          onNavigate('menu');
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import menu"
        description="Upload a photo or PDF of your paper menu and let AI build the digital version."
      />

      {/* Flow hint */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-content-subtle">
        {['Upload', 'AI processing', 'Review', 'Import'].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-3 text-[11px] font-bold text-content-muted">
              {i + 1}
            </span>
            {s}
            {i < 3 && <span className="text-content-subtle">→</span>}
          </li>
        ))}
      </ol>

      {/* Dropzone */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        hidden
        onChange={(e) => e.target.files?.[0] && submit(e.target.files[0])}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) submit(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-line-strong hover:bg-surface-2',
          uploading && 'pointer-events-none opacity-80',
        )}
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        {uploading ? (
          <>
            <p className="text-sm font-semibold text-content">Uploading… {progress}%</p>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-content">
              Drop your menu here, or <span className="text-brand">browse</span>
            </p>
            <p className="mt-1 text-xs text-content-subtle">JPG, PNG, WEBP or PDF · up to {MAX_MB} MB</p>
          </>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-content">Recent imports</h2>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}
        {!loading && uploads.length === 0 && (
          <EmptyState
            icon={FileImage}
            title="No imports yet"
            description="Upload a photo of your paper menu above to get started."
          />
        )}
        <ul className="space-y-2">
          {uploads.map((u) => (
            <UploadRow key={u.id} upload={u} onReview={() => setReviewId(u.id)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function UploadRow({ upload, onReview }: { upload: MenuUpload; onReview: () => void }) {
  const meta = STATUS_META[upload.status];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (upload.status !== 'processing') return;
    const t = setInterval(() => setStepIndex((i) => (i + 1) % PROCESSING_STEPS.length), 1600);
    return () => clearInterval(t);
  }, [upload.status]);

  const canReview =
    (upload.status === 'needs_review' || upload.status === 'parsed') &&
    (upload.parsed_items?.length ?? 0) > 0;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs">
      <div
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
          meta.tone === 'success' && 'bg-success-soft text-success',
          meta.tone === 'warning' && 'bg-warning-soft text-warning',
          meta.tone === 'danger' && 'bg-danger-soft text-danger',
          meta.tone === 'info' && 'bg-info-soft text-info',
        )}
      >
        {upload.status === 'processing' ? (
          <ScanText className="h-4 w-4 animate-pulse" />
        ) : upload.status === 'failed' ? (
          <TriangleAlert className="h-4 w-4" />
        ) : upload.status === 'needs_review' ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-content">Import #{upload.id}</p>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        <p className="truncate text-xs text-content-muted">
          {upload.status === 'processing'
            ? PROCESSING_STEPS[stepIndex]
            : upload.status === 'failed'
              ? upload.failure_reason ?? 'Processing failed.'
              : `${upload.parsed_items?.length ?? 0} items · ${
                  upload.ai_confidence_score != null
                    ? `${Math.round(upload.ai_confidence_score * 100)}% confidence`
                    : 'no confidence score'
                } · ${elapsed(upload.created_at)}`}
        </p>
      </div>

      {canReview && (
        <Button size="sm" variant={upload.status === 'needs_review' ? 'accent' : 'secondary'} onClick={onReview}>
          Review
        </Button>
      )}
    </li>
  );
}
