import { useEffect, useRef, useState } from 'react';
import { ownerApi } from '../lib/api';

type StagedItem = {
  category: string | null;
  name: string;
  description: string | null;
  price: number | null;
  valid: boolean;
};

type Upload = {
  id: number;
  status: string;
  ai_confidence_score: number | null;
  failure_reason: string | null;
  parsed_items: StagedItem[];
};

const STATUS_STYLE: Record<string, string> = {
  processing: 'bg-blue-100 text-blue-700',
  parsed: 'bg-emerald-100 text-emerald-700',
  needs_review: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

export function UploadTab() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [review, setReview] = useState<Upload | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => ownerApi.get('/menu-uploads').then((r) => setUploads(r.data.data));
  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      await ownerApi.post('/menu-uploads', fd);
      load();
    } finally {
      setBusy(false);
    }
  };

  const patch = (idx: number, changes: Partial<StagedItem>) =>
    setReview((r) =>
      r
        ? { ...r, parsed_items: r.parsed_items.map((it, i) => (i === idx ? { ...it, ...changes } : it)) }
        : r,
    );

  const publish = async () => {
    if (!review) return;
    await ownerApi.post(`/menu-uploads/${review.id}/publish`, {
      items: review.parsed_items
        .filter((i) => i.name && i.price != null)
        .map((i) => ({ category: i.category, name: i.name, description: i.description, price: i.price })),
    });
    setReview(null);
    load();
  };

  if (review) {
    const conf = review.ai_confidence_score;
    return (
      <div className="space-y-4">
        <button onClick={() => setReview(null)} className="text-sm font-medium text-slate-500 hover:text-ink">
          ← Back to uploads
        </button>

        <div className="card flex items-center justify-between p-4">
          <div>
            <p className="font-display text-lg font-bold">Review parsed items</p>
            <p className="text-sm text-slate-500">Edit anything the AI got wrong, then publish.</p>
          </div>
          <ConfidenceRing value={conf} />
        </div>

        <div className="space-y-2">
          {review.parsed_items.map((it, idx) => (
            <div
              key={idx}
              className="card grid grid-cols-12 items-center gap-2 p-2.5 text-sm"
            >
              <input
                className="field col-span-3 !bg-slate-50"
                value={it.category ?? ''}
                placeholder="Category"
                onChange={(e) => patch(idx, { category: e.target.value })}
              />
              <input
                className="field col-span-5 !bg-slate-50"
                value={it.name}
                placeholder="Item name"
                onChange={(e) => patch(idx, { name: e.target.value })}
              />
              <div className="col-span-3 flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  className="field !bg-slate-50"
                  type="number"
                  step="0.01"
                  value={it.price ?? ''}
                  onChange={(e) => patch(idx, { price: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <span
                className={`col-span-1 grid h-6 place-items-center rounded-md text-xs font-bold ${
                  it.name && it.price != null
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {it.name && it.price != null ? '✓' : '!'}
              </span>
            </div>
          ))}
        </div>

        <button onClick={publish} className="btn-accent w-full">
          Approve &amp; publish {review.parsed_items.filter((i) => i.name && i.price != null).length} items
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <div
        onClick={() => !busy && fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
        }}
        className={`card grid cursor-pointer place-items-center border-2 border-dashed px-6 py-14 text-center transition ${
          drag ? 'border-ember bg-ember/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        } ${busy ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-radial text-2xl text-white">
          {busy ? '⏳' : '📸'}
        </div>
        <p className="font-semibold text-ink">
          {busy ? 'Uploading & queueing…' : 'Drop a photo of your paper menu'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          or click to browse · JPG, PNG, WEBP or PDF up to 10 MB
        </p>
      </div>

      <div className="space-y-2">
        {uploads.map((u) => (
          <div key={u.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className={`chip ${STATUS_STYLE[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {u.status.replace('_', ' ')}
              </span>
              <div>
                <p className="text-sm font-medium">Upload #{u.id}</p>
                {u.failure_reason ? (
                  <p className="text-xs text-red-500">{u.failure_reason}</p>
                ) : (
                  u.ai_confidence_score != null && (
                    <p className="text-xs text-slate-400">
                      {Math.round(u.ai_confidence_score * 100)}% confidence ·{' '}
                      {u.parsed_items?.length ?? 0} items
                    </p>
                  )
                )}
              </div>
            </div>
            {(u.status === 'needs_review' || u.status === 'parsed') && u.parsed_items?.length > 0 && (
              <button onClick={() => setReview(u)} className="btn-primary !py-1.5 text-xs">
                Review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number | null }) {
  const pct = value == null ? 0 : Math.round(value * 100);
  const color = pct >= 80 ? '#0f766e' : pct >= 50 ? '#f97316' : '#dc2626';
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
        />
      </svg>
      <span className="absolute text-xs font-bold">{pct}%</span>
    </div>
  );
}
