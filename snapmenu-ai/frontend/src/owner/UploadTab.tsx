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

export function UploadTab() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
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

  const publish = async () => {
    if (!review) return;
    await ownerApi.post(`/menu-uploads/${review.id}/publish`, {
      items: review.parsed_items
        .filter((i) => i.name && i.price != null)
        .map((i) => ({
          category: i.category,
          name: i.name,
          description: i.description,
          price: i.price,
        })),
    });
    setReview(null);
    load();
  };

  if (review) {
    return (
      <div>
        <button onClick={() => setReview(null)} className="mb-3 text-sm text-gray-500 underline">
          ← Back
        </button>
        <h3 className="mb-2 font-semibold">
          Review parsed items · confidence{' '}
          {review.ai_confidence_score != null ? `${Math.round(review.ai_confidence_score * 100)}%` : '—'}
        </h3>
        <div className="space-y-2">
          {review.parsed_items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 rounded border bg-white p-2 text-sm">
              <input
                className="col-span-3 rounded border px-2 py-1"
                value={it.category ?? ''}
                placeholder="Category"
                onChange={(e) => patch(idx, { category: e.target.value })}
              />
              <input
                className="col-span-5 rounded border px-2 py-1"
                value={it.name}
                onChange={(e) => patch(idx, { name: e.target.value })}
              />
              <input
                className="col-span-2 rounded border px-2 py-1"
                type="number"
                step="0.01"
                value={it.price ?? ''}
                onChange={(e) => patch(idx, { price: e.target.value ? Number(e.target.value) : null })}
              />
              <span
                className={`col-span-2 flex items-center justify-center rounded text-xs ${
                  it.valid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {it.valid ? 'ok' : 'check'}
              </span>
            </div>
          ))}
        </div>
        <button onClick={publish} className="mt-4 rounded-lg bg-brand-accent px-4 py-2 font-semibold text-white">
          Approve &amp; publish
        </button>
      </div>
    );

    function patch(idx: number, changes: Partial<StagedItem>) {
      setReview((r) =>
        r
          ? { ...r, parsed_items: r.parsed_items.map((it, i) => (i === idx ? { ...it, ...changes } : it)) }
          : r,
      );
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="mb-6 w-full rounded-xl border-2 border-dashed py-10 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        {busy ? 'Uploading…' : 'Click to upload a photo of your paper menu'}
      </button>

      <ul className="space-y-2">
        {uploads.map((u) => (
          <li key={u.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
            <span>
              Upload #{u.id} —{' '}
              <span className="font-medium">{u.status.replace('_', ' ')}</span>
              {u.failure_reason && <span className="text-red-600"> · {u.failure_reason}</span>}
            </span>
            {(u.status === 'needs_review' || u.status === 'parsed') && u.parsed_items?.length > 0 && (
              <button onClick={() => setReview(u)} className="rounded bg-brand px-3 py-1 text-xs text-white">
                Review
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
