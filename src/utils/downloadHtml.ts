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

function resolveFilename(pathname: string): string {
  for (const [route, name] of Object.entries(PAGE_FILENAME_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) return name;
  }
  return 'FMS_Export';
}

function cleanHtml(raw: string): string {
  // Remove all <script> tags (live React bundles, Vite HMR, dev overlays)
  let cleaned = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove <link rel="modulepreload"> (Vite module graph hints)
  cleaned = cleaned.replace(/<link[^>]+rel=["']modulepreload["'][^>]*\/?>/gi, '');
  // Remove Vite/React dev overlay root containers
  cleaned = cleaned.replace(/<vite-error-overlay[^>]*>[\s\S]*?<\/vite-error-overlay>/gi, '');
  // Remove noscript fallbacks that reference bundled assets
  cleaned = cleaned.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
  return cleaned;
}

function buildOfflineDocument(bodyContent: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!-- Tailwind CSS — re-styles the snapshot without React runtime -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide icons (static SVG renderer) -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    /* Preserve any inline CSS custom properties and scrollbar hides */
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }
  </style>
</head>
${bodyContent}
</html>`;
}

export function downloadPageAsHtml(pathname: string = window.location.pathname): void {
  const rawHtml = document.documentElement.outerHTML;
  const cleaned = cleanHtml(rawHtml);

  // Extract just the <body>...</body> portion to avoid duplicate <head>
  const bodyMatch = cleaned.match(/<body[\s\S]*<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[0] : '<body>' + cleaned + '</body>';

  const today = new Date().toISOString().slice(0, 10);
  const baseName = resolveFilename(pathname);
  const filename = `${baseName}_${today}.html`;
  const pageTitle = baseName.replace(/_/g, ' ');

  const html = buildOfflineDocument(bodyContent, pageTitle);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke after a tick so the download has time to initiate
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
