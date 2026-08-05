import { jsPDF, GState } from 'jspdf';
import { getSiteOrigin } from './siteSeo';

const LOGO_PATH = '/logo.png';
const LOGO_WIDTH_MM = 95;
const WATERMARK_OPACITY = 0.1;
const URL_COLOR: [number, number, number] = [148, 163, 184];

let cachedLogoDataUrl: string | null | undefined;

/**
 * Loads PrepX logo as a data URL (cached for the session).
 * Returns null if the asset cannot be fetched — callers still draw URL text.
 */
export async function loadPdfLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl !== undefined) return cachedLogoDataUrl;

  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) {
      cachedLogoDataUrl = null;
      return null;
    }
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read logo'));
      reader.readAsDataURL(blob);
    });
    cachedLogoDataUrl = dataUrl;
    return dataUrl;
  } catch {
    cachedLogoDataUrl = null;
    return null;
  }
}

/**
 * Draws center logo watermark + site URL at top and bottom of the current page.
 */
export function applyPdfPageBranding(
  doc: jsPDF,
  logoDataUrl: string | null
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const siteUrl = getSiteOrigin();

  if (logoDataUrl) {
    const props = doc.getImageProperties(logoDataUrl);
    const logoH = (props.height * LOGO_WIDTH_MM) / props.width;
    const x = (pageW - LOGO_WIDTH_MM) / 2;
    const y = (pageH - logoH) / 2;

    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: WATERMARK_OPACITY }));
    doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_WIDTH_MM, logoH);
    doc.restoreGraphicsState();
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(URL_COLOR[0], URL_COLOR[1], URL_COLOR[2]);
  doc.text(siteUrl, pageW / 2, 8, { align: 'center' });
  doc.text(siteUrl, pageW / 2, pageH - 4.5, { align: 'center' });
}

/**
 * Applies branding to every page in the document.
 */
export function applyPdfDocumentBranding(
  doc: jsPDF,
  logoDataUrl: string | null
): void {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    applyPdfPageBranding(doc, logoDataUrl);
  }
}
