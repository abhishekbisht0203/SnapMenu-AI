import { useEffect, useState } from 'react';
import { ownerApi, friendlyError, unwrap, type Restaurant } from '../../lib/api';
import { Button, Field, Input, Modal, useToast } from '../../ui';

const SWATCHES = ['#0d9488', '#0f766e', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#111827'];

export function SettingsModal({
  open,
  onClose,
  restaurant,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onSaved: (r: Restaurant) => void;
}) {
  const [name, setName] = useState(restaurant.name);
  const [color, setColor] = useState(restaurant.primary_color);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName(restaurant.name);
      setColor(restaurant.primary_color);
    }
  }, [open, restaurant]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await ownerApi.put('/restaurant', { name, primary_color: color });
      onSaved(unwrap(res));
      toast.success('Settings saved');
      onClose();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Restaurant settings"
      description="This name and colour appear on your public menu."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Restaurant name" required htmlFor="rname">
          <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Brand colour" hint="Used as the accent on your customer menu.">
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setColor(s)}
                aria-label={`Use ${s}`}
                className="h-8 w-8 rounded-lg border border-line ring-offset-2 ring-offset-surface transition data-[on=true]:ring-2 data-[on=true]:ring-brand"
                data-on={color.toLowerCase() === s.toLowerCase()}
                style={{ background: s }}
              />
            ))}
            <label className="relative h-8 w-8 overflow-hidden rounded-lg border border-line">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer"
                aria-label="Custom colour"
              />
            </label>
          </div>
        </Field>

        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
            Preview
          </p>
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3 text-white"
            style={{ background: color }}
          >
            <span className="font-bold">{name || 'Your restaurant'}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">Menu</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
