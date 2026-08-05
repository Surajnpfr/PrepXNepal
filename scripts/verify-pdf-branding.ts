/**
 * Verification harness for PDF page branding (logo watermark + site URL).
 * Run: npx tsx scripts/verify-pdf-branding.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsPDF, GState } from 'jspdf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoPath = join(root, 'public', 'logo.png');
const outDir = join(root, 'tmp');
const outFile = join(outDir, 'verify-pdf-branding.pdf');

const LOGO_WIDTH_MM = 95;
const WATERMARK_OPACITY = 0.1;
const SITE_URL = 'https://prepxnepal.com';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const logoBytes = readFileSync(logoPath);
const logoDataUrl = `data:image/png;base64,${logoBytes.toString('base64')}`;

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();

doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(15, 23, 42);
doc.text('PrepXNepal Formula Library', 14, 14);
doc.text('Sample content over watermark', 14, 24);

doc.addPage();
doc.text('Page 2 content', 14, 14);

const totalPages = doc.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);

  const props = doc.getImageProperties(logoDataUrl);
  const logoH = (props.height * LOGO_WIDTH_MM) / props.width;
  const x = (pageW - LOGO_WIDTH_MM) / 2;
  const y = (pageH - logoH) / 2;

  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: WATERMARK_OPACITY }));
  doc.addImage(logoDataUrl, 'PNG', x, y, LOGO_WIDTH_MM, logoH);
  doc.restoreGraphicsState();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(SITE_URL, pageW / 2, 8, { align: 'center' });
  doc.text(SITE_URL, pageW / 2, pageH - 4.5, { align: 'center' });
  doc.text(`Page ${p} of ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' });
}

mkdirSync(outDir, { recursive: true });
const pdfBytes = doc.output('arraybuffer');
writeFileSync(outFile, Buffer.from(pdfBytes));

const pdfText = Buffer.from(pdfBytes).toString('latin1');
assert(pdfText.includes('/XObject') || pdfText.includes('Image'), 'PDF missing embedded image XObject');
assert(pdfBytes.byteLength > 10_000, `PDF too small (${pdfBytes.byteLength} bytes)`);
assert(totalPages === 2, `Expected 2 pages, got ${totalPages}`);

console.log(`OK: branded PDF written to ${outFile} (${pdfBytes.byteLength} bytes, ${totalPages} pages)`);
console.log(`    logo=${logoPath} (${logoBytes.length} bytes)`);
console.log(`    url=${SITE_URL} watermark opacity=${WATERMARK_OPACITY} width=${LOGO_WIDTH_MM}mm`);
