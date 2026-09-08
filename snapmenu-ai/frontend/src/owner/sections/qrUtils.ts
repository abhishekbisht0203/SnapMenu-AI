import type { Table } from '../../lib/api';

async function fetchSvg(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('QR fetch failed');
  return res.text();
}

export async function downloadQr(table: Table) {
  const svg = await fetchSvg(table.qr_svg_url);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `snapmenu-${slug(table.label)}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export async function printQr(tables: Table[]) {
  const cards = await Promise.all(
    tables.map(async (t) => {
      const svg = await fetchSvg(t.qr_svg_url);
      return `<figure><div class="qr">${svg}</div><figcaption>${escapeHtml(t.label)}</figcaption><small>${escapeHtml(
        t.menu_url,
      )}</small></figure>`;
    }),
  );

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) throw new Error('popup blocked');
  win.document.write(`<!doctype html><html><head><title>SnapMenu QR codes</title><style>
    *{box-sizing:border-box;font-family:Inter,system-ui,sans-serif}
    body{margin:0;padding:24px;display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
    figure{margin:0;border:1px solid #e2e8f0;border-radius:16px;padding:20px;text-align:center;page-break-inside:avoid}
    .qr{display:flex;justify-content:center}
    .qr svg{width:220px;height:220px}
    figcaption{margin-top:10px;font-weight:700;font-size:18px}
    small{display:block;margin-top:4px;color:#64748b;font-size:11px;word-break:break-all}
    @media print{body{padding:0}}
  </style></head><body>${cards.join('')}<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
  win.document.close();
}

export async function copyLink(url: string) {
  await navigator.clipboard.writeText(url);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'table';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
