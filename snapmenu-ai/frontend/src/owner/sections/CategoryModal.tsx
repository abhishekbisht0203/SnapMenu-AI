import { useEffect, useState } from 'react';
import { ownerApi, friendlyError, type Category } from '../../lib/api';
import { Button, Field, Input, Modal, useToast } from '../../ui';

export function CategoryModal({
  open,
  onClose,
  category,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onSaved: () => void;
}) {
  const editing = !!category;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setError(null);
    }
  }, [open, category]);

  const save = async () => {
    if (!name.trim()) {
      setError('Enter a category name.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await ownerApi.put(`/categories/${category!.id}`, { name: name.trim() });
        toast.success('Category renamed');
      } else {
        await ownerApi.post('/categories', { name: name.trim() });
        toast.success('Category created');
      }
      onSaved();
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
      title={editing ? 'Rename category' : 'New category'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={save}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <Field label="Category name" required error={error} htmlFor="cat-name">
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="e.g. Starters"
          autoFocus
        />
      </Field>
    </Modal>
  );
}
