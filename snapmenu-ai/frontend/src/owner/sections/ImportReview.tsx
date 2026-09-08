import { useMemo, useState } from 'react';
import { ArrowLeft, CircleAlert, Trash2 } from 'lucide-react';
import { ownerApi, friendlyError, type MenuUpload, type StagedItem } from '../../lib/api';
import { Button, Input, useToast } from '../../ui';

type Row = StagedItem & { _key: number };

export function ImportReview({
  upload,
  onBack,
  onImported,
}: {
  upload: MenuUpload;
  onBack: () => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() =>
    (upload.parsed_items ?? []).map((it, i) => ({ ...it, _key: i })),
  );
  const [busy, setBusy] = useState(false);

  const patch = (key: number, changes: Partial<StagedItem>) =>
    setRows((r) => r.map((row) => (row._key === key ? { ...row, ...changes } : row)));

  const remove = (key: number) => setRows((r) => r.filter((row) => row._key !== key));

  const valid = useMemo(
    () => rows.filter((r) => r.name.trim() && r.price != null && !Number.isNaN(r.price) && r.price >= 0),
    [rows],
  );
  const uncertain = rows.length - valid.length;
  const confidence = upload.ai_confidence_score;

  const importMenu = async () => {
    setBusy(true);
    try {
      await ownerApi.post(`/menu-uploads/${upload.id}/publish`, {
        items: valid.map((r) => ({
          category: r.category?.trim() || null,
          name: r.name.trim(),
          description: r.description?.trim() || null,
          price: r.price,
        })),
      });
      toast.success(`Imported ${valid.length} item${valid.length === 1 ? '' : 's'} into your menu`);
      onImported();
    } catch (e) {
      toast.error(friendlyError(e, 'Could not import the menu.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" /> Back to imports
      </button>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-content">Review extracted menu</h2>
          <p className="text-sm text-content-muted">
            Check each row, fix anything the AI got wrong, then import.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-content-subtle">AI confidence</p>
            <p className="text-lg font-bold tabular-nums text-content">
              {confidence != null ? `${Math.round(confidence * 100)}%` : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-content-subtle">Ready to import</p>
            <p className="text-lg font-bold tabular-nums text-content">
              {valid.length}/{rows.length}
            </p>
          </div>
        </div>
      </div>

      {uncertain > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {uncertain} row{uncertain === 1 ? '' : 's'} need a name and price before they can be
            imported. Fix or remove them below.
          </span>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-line sm:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-content-subtle">
            <tr>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Description</th>
              <th className="w-28 px-3 py-2">Price</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const ok = r.name.trim() && r.price != null && r.price >= 0;
              return (
                <tr key={r._key} className={ok ? '' : 'bg-warning-soft/40'}>
                  <td className="px-3 py-1.5">
                    <Input
                      value={r.category ?? ''}
                      onChange={(e) => patch(r._key, { category: e.target.value })}
                      className="h-9"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      value={r.name}
                      onChange={(e) => patch(r._key, { name: e.target.value })}
                      className="h-9"
                      aria-invalid={!r.name.trim()}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      value={r.description ?? ''}
                      onChange={(e) => patch(r._key, { description: e.target.value })}
                      className="h-9"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.price ?? ''}
                      onChange={(e) =>
                        patch(r._key, { price: e.target.value === '' ? null : Number(e.target.value) })
                      }
                      className="h-9"
                      aria-invalid={r.price == null}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => remove(r._key)}
                      aria-label={`Remove ${r.name || 'row'}`}
                      className="grid h-8 w-8 place-items-center rounded-md text-content-subtle hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {rows.map((r) => {
          const ok = r.name.trim() && r.price != null && r.price >= 0;
          return (
            <div
              key={r._key}
              className={`space-y-2 rounded-xl border p-3 ${ok ? 'border-line bg-surface' : 'border-warning/40 bg-warning-soft/40'}`}
            >
              <div className="flex gap-2">
                <Input
                  value={r.name}
                  onChange={(e) => patch(r._key, { name: e.target.value })}
                  placeholder="Item name"
                  className="h-9"
                />
                <button
                  onClick={() => remove(r._key)}
                  aria-label="Remove row"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-content-subtle hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={r.category ?? ''}
                  onChange={(e) => patch(r._key, { category: e.target.value })}
                  placeholder="Category"
                  className="h-9"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={r.price ?? ''}
                  onChange={(e) =>
                    patch(r._key, { price: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  placeholder="Price"
                  className="h-9 w-24"
                />
              </div>
              <Input
                value={r.description ?? ''}
                onChange={(e) => patch(r._key, { description: e.target.value })}
                placeholder="Description (optional)"
                className="h-9"
              />
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-16 z-10 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/95 p-3 shadow-lg backdrop-blur md:bottom-4">
        <p className="text-sm text-content-muted">
          <span className="font-semibold text-content">{valid.length}</span> item
          {valid.length === 1 ? '' : 's'} will be added
        </p>
        <Button onClick={importMenu} loading={busy} disabled={valid.length === 0}>
          Import menu
        </Button>
      </div>
    </div>
  );
}
