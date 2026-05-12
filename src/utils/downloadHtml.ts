const PAGE_FILENAME_MAP: Record<string, string> = {
  '/quarters/requests': 'Quarters_Requests_Export',
  '/quarters/manager': 'Quarters_Manager_Export',
  '/quarters/rent': 'Quarters_Rent_Export',
  '/quarters': 'Quarters_Freeview_Export',
  '/properties': 'FAMS_Properties_Export',
  '/manager': 'FAMS_Manager_Export',
  '/check-in': 'FAMS_CheckIn_Export',
  '/maintenance': 'FAMS_Maintenance_Export',
  '/bookings': 'FAMS_Bookings_Export',
  '/admin': 'FAMS_Admin_Export',
  '/dashboard': 'FMS_Dashboard_Export',
};

const PAGE_TITLE_MAP: Record<string, string> = {
  '/quarters/requests': 'Government Quarters — Allotment Requests',
  '/quarters/manager': 'Estate Manager — Quarters Dashboard',
  '/quarters/rent': 'Quarters — Rent & Payments',
  '/quarters': 'Quarters — Inventory Overview',
  '/properties': 'FAMS — Properties',
  '/manager': 'FAMS — Manager Dashboard',
  '/check-in': 'FAMS — Check-In',
  '/maintenance': 'FAMS — Maintenance',
  '/bookings': 'FAMS — Bookings',
  '/admin': 'FAMS — Administration',
  '/dashboard': 'FMS — Dashboard',
};

function resolveFilename(pathname: string): string {
  for (const [route, name] of Object.entries(PAGE_FILENAME_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return name;
  }
  return 'FMS_Export';
}

function resolveTitle(pathname: string): string {
  for (const [route, title] of Object.entries(PAGE_TITLE_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return title;
  }
  return 'FMS — Export';
}

function collectInlineStyles(): string {
  const parts: string[] = [];
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules ?? []);
        for (const rule of rules) {
          parts.push(rule.cssText);
        }
      } catch {
        // Cross-origin sheet — skip
      }
    }
  } catch {
    // Ignore
  }
  return parts.join('\n');
}

function hideTransientElements(): (() => void) {
  const selectors = [
    '[data-toast]',
    '[role="status"]',
    '[data-radix-popper-content-wrapper]',
    '[role="dialog"]',
    '.animate-ping',
    '[data-vite-dev-id]',
  ];
  const hidden: Array<{ el: HTMLElement; prev: string }> = [];
  for (const sel of selectors) {
    document.querySelectorAll<HTMLElement>(sel).forEach(el => {
      hidden.push({ el, prev: el.style.display });
      el.style.display = 'none';
    });
  }
  return () => {
    for (const { el, prev } of hidden) {
      el.style.display = prev;
    }
  };
}

function cleanHtml(raw: string): string {
  let s = raw;
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<link[^>]+rel=["']modulepreload["'][^>]*\/?>/gi, '');
  s = s.replace(/<link[^>]+href=["'][^"']*\.js["'][^>]*\/?>/gi, '');
  s = s.replace(/<vite-error-overlay[^>]*>[\s\S]*?<\/vite-error-overlay>/gi, '');
  s = s.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
  return s;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function buildDocument(bodyContent: string, docTitle: string, pathname: string, inlineStyles: string): string {
  const now = new Date();
  const dateStr = formatDateTime(now);
  const isoDate = now.toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="FMS — Facility Management System" />
  <meta name="description" content="${docTitle} — Exported on ${isoDate}" />
  <meta name="generator" content="FMS Export Utility" />
  <title>${docTitle}</title>
  <style>
${inlineStyles}

/* ── Export document chrome ─────────────────────────────────── */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

body {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.fms-export-header {
  position: relative;
  background: #ffffff;
  border-bottom: 3px solid #0d9488;
  padding: 18px 32px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  page-break-inside: avoid;
}

.fms-export-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fms-export-header__icon {
  width: 40px;
  height: 40px;
  background: #0d9488;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fms-export-header__org {
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}

.fms-export-header__title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.fms-export-header__route {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 3px;
  font-family: ui-monospace, monospace;
}

.fms-export-header__meta {
  text-align: right;
  flex-shrink: 0;
}

.fms-export-header__confidential {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 4px;
  padding: 2px 8px;
  margin-bottom: 6px;
}

.fms-export-header__date {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}

.fms-export-header__date strong {
  color: #374151;
  font-weight: 600;
}

.fms-export-footer {
  margin-top: 32px;
  border-top: 1px solid #e5e7eb;
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  font-size: 10px;
  color: #9ca3af;
  background: #f9fafb;
  page-break-inside: avoid;
}

.fms-export-footer__left { display: flex; flex-direction: column; gap: 2px; }
.fms-export-footer__right { text-align: right; }
.fms-export-footer code { font-family: ui-monospace, monospace; font-size: 9px; }

/* ── Print rules ────────────────────────────────────────────── */
@media print {
  .fms-export-header,
  .fms-export-footer { position: relative !important; }

  /* Hide interactive controls that are meaningless in print */
  button:not([data-print-keep]),
  [role="menu"],
  [role="menuitem"],
  [data-toast],
  [role="status"],
  [data-radix-popper-content-wrapper],
  [role="dialog"],
  .animate-ping,
  [aria-label="Filter"],
  [aria-label="Sort"] {
    display: none !important;
  }

  /* Prevent cards from splitting across pages */
  [class*="rounded-xl"],
  [class*="rounded-lg"] {
    page-break-inside: avoid;
  }
}
  </style>
</head>
<body>

<!-- FMS Export Header -->
<div class="fms-export-header">
  <div class="fms-export-header__brand">
    <div class="fms-export-header__icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <div>
      <div class="fms-export-header__org">Facility Management System</div>
      <div class="fms-export-header__title">${docTitle}</div>
      <div class="fms-export-header__route">${pathname}</div>
    </div>
  </div>
  <div class="fms-export-header__meta">
    <div class="fms-export-header__confidential">Confidential — For Official Use Only</div>
    <div class="fms-export-header__date">
      <strong>Exported on</strong><br/>
      ${dateStr}
    </div>
  </div>
</div>

<!-- Page content snapshot -->
${bodyContent}

<!-- FMS Export Footer -->
<div class="fms-export-footer">
  <div class="fms-export-footer__left">
    <span><strong style="color:#374151">FMS</strong> — Facility Management System</span>
    <span>This document is a point-in-time snapshot exported from the FMS application.</span>
  </div>
  <div class="fms-export-footer__right">
    <span>Route: <code>${pathname}</code></span><br/>
    <span>Generated: ${dateStr}</span>
  </div>
</div>

</body>
</html>`;
}

export interface DownloadHtmlOptions {
  title?: string;
  includeTimestamp?: boolean;
}

export function downloadPageAsHtml(
  pathname: string = window.location.pathname,
  options: DownloadHtmlOptions = {},
): void {
  const inlineStyles = collectInlineStyles();

  const restoreHidden = hideTransientElements();
  const rawHtml = document.documentElement.outerHTML;
  restoreHidden();

  const cleaned = cleanHtml(rawHtml);

  const bodyMatch = cleaned.match(/<body[\s\S]*<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[0] : `<body>${cleaned}</body>`;

  const baseName = resolveFilename(pathname);
  const docTitle = options.title ?? resolveTitle(pathname);

  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const filename = options.includeTimestamp === false
    ? `${baseName}.html`
    : `${baseName}_${datePart}.html`;

  const html = buildDocument(bodyContent, docTitle, pathname, inlineStyles);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
