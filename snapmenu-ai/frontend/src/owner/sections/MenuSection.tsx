import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  FolderPlus,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  EmptyState,
  PageHeader,
  SearchBar,
  Segmented,
  Skeleton,
  StatCard,
  Switch,
  cn,
  useToast,
} from '../../ui';
import { ownerApi, friendlyError, type Category, type MenuItem } from '../../lib/api';
import { money } from '../../lib/format';
import { MenuItemDrawer } from './MenuItemDrawer';
import { CategoryModal } from './CategoryModal';

type Availability = 'all' | 'available' | 'unavailable';

export function MenuSection({ isOwner }: { isOwner: boolean }) {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState<Availability>('all');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const [itemDrawer, setItemDrawer] = useState<{ item: MenuItem | null; categoryId: number | null } | null>(null);
  const [catModal, setCatModal] = useState<{ category: Category | null } | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await ownerApi.get('/categories');
      setCategories(data.data);
    } catch (e) {
      toast.error(friendlyError(e, 'Could not load the menu.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const items = categories.flatMap((c) => c.items);
    return {
      categories: categories.length,
      items: items.length,
      available: items.filter((i) => i.is_available).length,
    };
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => {
          if (availability === 'available' && !i.is_available) return false;
          if (availability === 'unavailable' && i.is_available) return false;
          if (q && !`${i.name} ${i.description ?? ''}`.toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((c) => (q || availability !== 'all' ? c.items.length > 0 : true));
  }, [categories, query, availability]);

  const toggleAvailability = async (item: MenuItem) => {
    setCategories((cs) =>
      cs.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)),
      })),
    );
    try {
      await ownerApi.patch(`/menu-items/${item.id}`, { is_available: !item.is_available });
    } catch (e) {
      toast.error(friendlyError(e));
      load();
    }
  };

  const removeItem = async () => {
    if (!deleteItem) return;
    await ownerApi.delete(`/menu-items/${deleteItem.id}`);
    toast.success('Item deleted');
    load();
  };

  const removeCategory = async () => {
    if (!deleteCat) return;
    await ownerApi.delete(`/categories/${deleteCat.id}`);
    toast.success('Category deleted');
    load();
  };

  const toggleCollapse = (id: number) =>
    setCollapsed((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Menu"
        description="Manage the dishes diners see and order from."
        actions={
          isOwner && (
            <>
              <Button variant="secondary" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setCatModal({ category: null })}>
                <span className="hidden sm:inline">New category</span>
                <span className="sm:hidden">Category</span>
              </Button>
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setItemDrawer({ item: null, categoryId: categories[0]?.id ?? null })}
                disabled={categories.length === 0}
              >
                Add item
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Categories" value={stats.categories} icon={FolderPlus} tone="brand" loading={loading} />
        <StatCard label="Menu items" value={stats.items} icon={UtensilsCrossed} tone="accent" loading={loading} />
        <StatCard label="Available" value={stats.available} icon={UtensilsCrossed} tone="success" loading={loading} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search items" className="sm:w-64" />
        <Segmented<Availability>
          value={availability}
          onChange={setAvailability}
          options={[
            { value: 'all', label: 'All' },
            { value: 'available', label: 'Available' },
            { value: 'unavailable', label: '86’d' },
          ]}
        />
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <EmptyState
          icon={UtensilsCrossed}
          title="Start building your digital menu"
          description="Add a category and items by hand, or use Import to build the whole menu from a photo."
          action={
            isOwner && (
              <Button icon={<FolderPlus className="h-4 w-4" />} onClick={() => setCatModal({ category: null })}>
                Add your first category
              </Button>
            )
          }
        />
      )}

      {!loading && categories.length > 0 && filtered.length === 0 && (
        <EmptyState icon={UtensilsCrossed} title="No items match your filters" description="Try a different search or filter." />
      )}

      <div className="space-y-3">
        {filtered.map((c) => {
          const isCollapsed = collapsed.has(c.id);
          const availableCount = c.items.filter((i) => i.is_available).length;
          return (
            <section key={c.id} className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
              <header className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
                <button
                  onClick={() => toggleCollapse(c.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-content-subtle transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  <span className="truncate font-semibold text-content">{c.name}</span>
                  <Badge tone="neutral">{c.items.length}</Badge>
                  {c.items.length > 0 && availableCount < c.items.length && (
                    <Badge tone="warning">{c.items.length - availableCount} off</Badge>
                  )}
                </button>
                {isOwner && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => setItemDrawer({ item: null, categoryId: c.id })}
                    >
                      <span className="hidden sm:inline">Item</span>
                    </Button>
                    <Dropdown
                      trigger={({ toggle }) => (
                        <Button size="icon" variant="ghost" onClick={toggle} aria-label={`${c.name} options`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      )}
                    >
                      {(close) => (
                        <>
                          <DropdownItem
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => {
                              setCatModal({ category: c });
                              close();
                            }}
                          >
                            Rename
                          </DropdownItem>
                          <DropdownItem
                            danger
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => {
                              setDeleteCat(c);
                              close();
                            }}
                          >
                            Delete category
                          </DropdownItem>
                        </>
                      )}
                    </Dropdown>
                  </div>
                )}
              </header>

              {!isCollapsed && (
                <ul className="divide-y divide-line border-t border-line">
                  {c.items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', i.is_available ? 'text-content' : 'text-content-subtle line-through')}>
                          {i.name}
                        </p>
                        {i.description && (
                          <p className="truncate text-xs text-content-muted">{i.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-content">
                        {money(i.price, i.currency ?? 'USD')}
                      </span>
                      {isOwner ? (
                        <>
                          <Switch
                            size="sm"
                            checked={i.is_available}
                            onChange={() => toggleAvailability(i)}
                            label={`Toggle availability for ${i.name}`}
                          />
                          <Dropdown
                            trigger={({ toggle }) => (
                              <Button size="icon" variant="ghost" onClick={toggle} aria-label={`${i.name} options`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            )}
                          >
                            {(close) => (
                              <>
                                <DropdownItem
                                  icon={<Pencil className="h-4 w-4" />}
                                  onClick={() => {
                                    setItemDrawer({ item: i, categoryId: i.menu_category_id });
                                    close();
                                  }}
                                >
                                  Edit item
                                </DropdownItem>
                                <DropdownItem
                                  danger
                                  icon={<Trash2 className="h-4 w-4" />}
                                  onClick={() => {
                                    setDeleteItem(i);
                                    close();
                                  }}
                                >
                                  Delete item
                                </DropdownItem>
                              </>
                            )}
                          </Dropdown>
                        </>
                      ) : (
                        <Badge tone={i.is_available ? 'success' : 'neutral'}>
                          {i.is_available ? 'Available' : '86’d'}
                        </Badge>
                      )}
                    </li>
                  ))}
                  {c.items.length === 0 && (
                    <li className="px-4 py-4 text-xs text-content-subtle">No items in this category yet.</li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <MenuItemDrawer
        open={!!itemDrawer}
        onClose={() => setItemDrawer(null)}
        item={itemDrawer?.item ?? null}
        defaultCategoryId={itemDrawer?.categoryId ?? null}
        categories={categories}
        onSaved={load}
      />
      <CategoryModal
        open={!!catModal}
        onClose={() => setCatModal(null)}
        category={catModal?.category ?? null}
        onSaved={load}
      />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title={`Delete “${deleteItem?.name}”?`}
        message="This removes the item from your menu. Existing orders keep their record."
        confirmLabel="Delete item"
        onConfirm={removeItem}
      />
      <ConfirmDialog
        open={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        title={`Delete “${deleteCat?.name}”?`}
        message="Items in this category won’t be deleted — they’ll become uncategorised."
        confirmLabel="Delete category"
        onConfirm={removeCategory}
      />
    </div>
  );
}
