import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Trash2,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchBar,
  Skeleton,
  StatCard,
  useToast,
} from '../../ui';
import { ownerApi, friendlyError, type Table } from '../../lib/api';
import { copyLink, downloadQr, printQr } from './qrUtils';

export function TablesSection() {
  const toast = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ table: Table | null } | null>(null);
  const [remove, setRemove] = useState<Table | null>(null);
  const [preview, setPreview] = useState<Table | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await ownerApi.get('/tables');
      setTables(data.data);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tables.filter((t) => t.label.toLowerCase().includes(q)) : tables;
  }, [tables, query]);

  const doCopy = async (t: Table) => {
    try {
      await copyLink(t.menu_url);
      setCopied(t.id);
      setTimeout(() => setCopied(null), 1600);
      toast.success('Ordering link copied');
    } catch {
      toast.error('Couldn’t copy the link.');
    }
  };

  const doDownload = async (t: Table) => {
    try {
      await downloadQr(t);
    } catch {
      toast.error('Couldn’t download the QR code.');
    }
  };

  const doPrint = async (list: Table[]) => {
    if (list.length === 0) return;
    setPrinting(true);
    try {
      await printQr(list);
    } catch {
      toast.error('Allow pop-ups to print QR codes.');
    } finally {
      setPrinting(false);
    }
  };

  const removeTable = async () => {
    if (!remove) return;
    await ownerApi.delete(`/tables/${remove.id}`);
    toast.success('Table removed');
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tables & QR codes"
        description="Print a QR for each table — scanning it opens that table’s ordering page."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Printer className="h-4 w-4" />}
              loading={printing}
              onClick={() => doPrint(filtered)}
              disabled={filtered.length === 0}
            >
              <span className="hidden sm:inline">Print all</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ table: null })}>
              Add table
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Tables" value={tables.length} icon={QrCode} tone="brand" loading={loading} />
        <StatCard label="QR codes" value={tables.length} icon={QrCode} tone="accent" loading={loading} />
        <StatCard
          label="Ordering pages"
          value={tables.length}
          icon={ExternalLink}
          tone="info"
          loading={loading}
          hint="One per table"
        />
      </div>

      {tables.length > 0 && (
        <SearchBar value={query} onChange={setQuery} placeholder="Search tables" className="sm:w-64" />
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && tables.length === 0 && (
        <EmptyState
          icon={QrCode}
          title="Add your first table"
          description="Each table gets a unique QR code that opens its own ordering page."
          action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ table: null })}>Add a table</Button>}
        />
      )}

      {!loading && tables.length > 0 && filtered.length === 0 && (
        <EmptyState icon={QrCode} title="No tables match your search" />
      )}

      <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((t) => (
          <div key={t.id} className="group flex flex-col rounded-xl border border-line bg-surface p-3 text-center shadow-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="truncate text-sm font-semibold text-content">{t.label}</span>
              <Dropdown
                trigger={({ toggle }) => (
                  <Button size="icon" variant="ghost" onClick={toggle} aria-label={`${t.label} options`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                )}
              >
                {(close) => (
                  <>
                    <DropdownItem icon={<ExternalLink className="h-4 w-4" />} onClick={() => { window.open(t.menu_url, '_blank'); close(); }}>
                      Open ordering page
                    </DropdownItem>
                    <DropdownItem icon={<Copy className="h-4 w-4" />} onClick={() => { doCopy(t); close(); }}>
                      Copy link
                    </DropdownItem>
                    <DropdownItem icon={<Download className="h-4 w-4" />} onClick={() => { doDownload(t); close(); }}>
                      Download QR
                    </DropdownItem>
                    <DropdownItem icon={<Printer className="h-4 w-4" />} onClick={() => { doPrint([t]); close(); }}>
                      Print QR
                    </DropdownItem>
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { setEditing({ table: t }); close(); }}>
                      Rename
                    </DropdownItem>
                    <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { setRemove(t); close(); }}>
                      Delete
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>

            <button
              onClick={() => setPreview(t)}
              className="mx-auto my-1 rounded-lg border border-line bg-white p-2 transition-transform hover:scale-[1.03]"
              aria-label={`Enlarge QR for ${t.label}`}
            >
              <img src={t.qr_svg_url} alt={`QR code for ${t.label}`} className="h-24 w-24" loading="lazy" />
            </button>

            <div className="mt-2 flex gap-1.5">
              <Button size="sm" variant="secondary" fullWidth onClick={() => doCopy(t)}>
                {copied === t.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === t.id ? 'Copied' : 'Link'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => doDownload(t)} aria-label="Download QR">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <TableModal
        open={!!editing}
        onClose={() => setEditing(null)}
        table={editing?.table ?? null}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title={`Delete “${remove?.label}”?`}
        message="The QR code for this table will stop working. Print a new one if you re-add it."
        confirmLabel="Delete table"
        onConfirm={removeTable}
      />

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.label ?? 'QR code'} size="sm">
        {preview && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-line bg-white p-4">
              <img src={preview.qr_svg_url} alt={`QR code for ${preview.label}`} className="h-56 w-56" />
            </div>
            <p className="break-all text-center text-xs text-content-muted">{preview.menu_url}</p>
            <div className="flex w-full gap-2">
              <Button variant="secondary" fullWidth icon={<Copy className="h-4 w-4" />} onClick={() => doCopy(preview)}>
                Copy link
              </Button>
              <Button fullWidth icon={<Download className="h-4 w-4" />} onClick={() => doDownload(preview)}>
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TableModal({
  open,
  onClose,
  table,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  table: Table | null;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setLabel(table?.label ?? '');
      setError(null);
    }
  }, [open, table]);

  const save = async () => {
    if (!label.trim()) {
      setError('Enter a table name.');
      return;
    }
    setBusy(true);
    try {
      if (table) {
        await ownerApi.put(`/tables/${table.id}`, { label: label.trim() });
        toast.success('Table renamed');
      } else {
        await ownerApi.post('/tables', { label: label.trim() });
        toast.success('Table added');
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
      title={table ? 'Rename table' : 'Add table'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={save}>
            {table ? 'Save' : 'Add table'}
          </Button>
        </>
      }
    >
      <Field label="Table name" required error={error} htmlFor="table-label">
        <Input
          id="table-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="e.g. Table 4, Patio 2, Bar"
          autoFocus
        />
      </Field>
    </Modal>
  );
}
