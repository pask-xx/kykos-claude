/**
 * print-window — utility per aprire una finestra di stampa con un documento HTML
 * autocostruito. Normalizza i 3 pattern di stampa presenti nel progetto:
 *
 *  - `A4`: foglio standard con margini 15mm, layout centrato.
 *    Usato da `street-to-deliver/page.tsx:132-194` per stampa QR CODE.
 *  - `50x30` / `50x40`: etichette fisiche 50×30mm o 50×40mm senza margini.
 *    Usato da `print-label/[requestId]/page.tsx`, `shelf-label/page.tsx`,
 *    `deposit/page.tsx`, `deposit/[requestId]/page.tsx`,
 *    `goods-deposit/[requestId]/page.tsx`.
 *
 * Wrapper minimalista per evitare di duplicare il pattern
 * `window.open + document.write + window.print` in N pagine. Usa `useQrActions`
 * per il caso QR, o direttamente `openPrintWindow` per layout custom.
 */

export type PrintSize = 'A4' | '50x30' | '50x40';

export interface PrintOptions {
  size: PrintSize;
  title: string;
  /** Solo contenuto del body (header, info, QR, footer). Il <style> viene generato da `size`. */
  bodyHtml: string;
  /** CSS extra opzionale (custom layout). Iniettato DOPO lo style di base. */
  preStyles?: string;
}

const sizeConfig: Record<
  PrintSize,
  { width: number; height: number; pageSize: string; defaultStyles: string }
> = {
  A4: {
    width: 500,
    height: 700,
    pageSize: 'A4',
    defaultStyles: `
      @page { size: A4; margin: 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 10px; text-align: center; }
      .header { margin-bottom: 15px; }
      .logo-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
      .logo-row img { height: 40px; width: auto; }
      .title { font-size: 14pt; font-weight: bold; color: #111827; margin-bottom: 8px; }
      .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 15px; }
      .qr-container { text-align: center; margin: 15px 0; }
      .qr-container img { width: 220px; height: 220px; }
      .footer { font-size: 9pt; color: #9ca3af; margin-top: 20px; }
    `,
  },
  '50x30': {
    width: 400,
    height: 400,
    pageSize: '50mm 30mm',
    defaultStyles: `
      @page { size: 50mm 30mm; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 50mm; height: 30mm; }
      body { padding: 2mm; }
      .logo-row { display: flex; align-items: center; justify-content: center; gap: 1mm; }
      .logo-row img { display: block; height: 6mm; width: auto; }
    `,
  },
  '50x40': {
    width: 400,
    height: 450,
    pageSize: '50mm 40mm',
    defaultStyles: `
      @page { size: 50mm 40mm; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 50mm; height: 40mm; }
      body { padding: 2mm; }
      .logo-row { display: flex; align-items: center; justify-content: center; gap: 1mm; }
      .logo-row img { display: block; height: 6mm; width: auto; }
    `,
  },
};

/**
 * Costruisce il documento HTML completo pronto per `document.write`.
 * Esportato per consentire unit-test sull'output senza aprire finestre.
 */
export function buildPrintDocument({ size, title, bodyHtml, preStyles }: PrintOptions): string {
  const config = sizeConfig[size];
  const styles = preStyles ? `${config.defaultStyles}\n${preStyles}` : config.defaultStyles;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeAttr(title)}</title>
  <style>${styles}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Apre una nuova finestra con il documento di stampa e invoca `window.print()`.
 * - Restituisce subito se l'apertura popup fallisce (blocker, SSR, ecc.)
 *   senza lanciare eccezioni (fail-soft).
 * - `document.close()` è necessario per finalizzare il rendering prima di `print()`.
 */
export function openPrintWindow(options: PrintOptions): void {
  if (typeof window === 'undefined') return;
  const config = sizeConfig[options.size];

  const printWindow = window.open('', '', `width=${config.width},height=${config.height}`);
  if (!printWindow) return;

  printWindow.document.write(buildPrintDocument(options));
  printWindow.document.close();
  printWindow.print();
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
