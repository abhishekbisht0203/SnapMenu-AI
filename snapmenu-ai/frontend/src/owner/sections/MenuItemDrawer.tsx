import { useEffect, useState } from 'react';
import { ownerApi, friendlyError, type Category, type MenuItem } from '../../lib/api';
import { Button, Field, Input, Modal, Select, Switch, Textarea, useToast } from '../../ui';

type Draft = {
  name: string;
  description: string;
  price: string;
  menu_category_id: string;
  is_available: boolean;
};

const empty = (categoryId?: number | null): Draft => ({
  name: '',
  description: '',
  price: '',
  menu_category_id: categoryId ? String(categoryId) : '',
  is_available: true,
});

export function MenuItemDrawer({
  open,
  onClose,
  item,
  defaultCategoryId,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  defaultCategoryId?: number | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const editing = !!item;
  const [draft, setDraft] = useState<Draft>(empty(defaultCategoryId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDraft(
      item
        ? {
            name: item.name,
            description: item.description ?? '',
            price: String(item.price),
            menu_category_id: item.menu_category_id ? String(item.menu_category_id) : '',
            is_available: item.is_available,
          }
        : empty(defaultCategoryId),
    );
  }, [open, item, defaultCategoryId]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = 'Give the item a name.';
    const price = Number(draft.price);
    if (draft.price === '' || Number.isNaN(price) || price < 0) e.price = 'Enter a valid price.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: Number(draft.price),
        menu_category_id: draft.menu_category_id ? Number(draft.menu_category_id) : null,
        is_available: draft.is_available,
      };
      if (editing) {
        await ownerApi.put(`/menu-items/${item!.id}`, payload);
        toast.success('Item updated');
      } else {
        await ownerApi.post('/menu-items', payload);
        toast.success('Item added');
      }
      onSaved();
      onClose();
    } catch (err) {
      const data = (err as any)?.response?.data?.errors as Record<string, string[]> | undefined;
      if (data) setErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k.split('.')[0], v[0]])));
      toast.error(friendlyError(err, 'Could not save the item.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit item' : 'Add menu item'}
      description={editing ? item?.name : 'Create a new dish, drink or side.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={save}>
            {editing ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required error={errors.name} htmlFor="mi-name">
          <Input
            id="mi-name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={!!errors.name}
            placeholder="e.g. Margherita Pizza"
          />
        </Field>

        <Field label="Description" hint="Shown to diners under the item name." htmlFor="mi-desc">
          <Textarea
            id="mi-desc"
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="San Marzano tomato, fior di latte, basil"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price" required error={errors.price} htmlFor="mi-price">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-subtle">
                $
              </span>
              <Input
                id="mi-price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => set('price', e.target.value)}
                aria-invalid={!!errors.price}
                className="pl-7"
              />
            </div>
          </Field>

          <Field label="Category" error={errors.menu_category_id} htmlFor="mi-cat">
            <Select
              id="mi-cat"
              value={draft.menu_category_id}
              onChange={(e) => set('menu_category_id', e.target.value)}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-content">Available to order</p>
            <p className="text-xs text-content-muted">Turn off to temporarily hide from the menu.</p>
          </div>
          <Switch
            checked={draft.is_available}
            onChange={(v) => set('is_available', v)}
            label="Available to order"
          />
        </div>
      </div>
    </Modal>
  );
}
