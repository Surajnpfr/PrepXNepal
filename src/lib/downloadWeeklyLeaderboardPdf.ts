import { jsPDF } from 'jspdf';
import { applyPdfDocumentBranding, loadPdfLogoDataUrl } from './pdfPageBranding';
import type { WeeklyLeaderboardExportPayload } from './leaderboardApi';

function safeFileName(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-US');
}

/**
 * Staff PDF — professional weekly results sheet after the window ends.
 * Grid table: Rank | Full Name | Username | Score | Completed At (no emails).
 */
export async function downloadWeeklyLeaderboardPdf(
  data: WeeklyLeaderboardExportPayload
): Promise<{ ok: true; fileName: string } | { ok: false; error: string }> {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const tableRight = pageW - marginX;
    const logoDataUrl = await loadPdfLogoDataUrl();

    let y = 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('PrepX Nepal — Weekly Open Mock Results', marginX, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const setLabel = `Weekly Set: ${data.mock.title || 'Weekly mock'}`;
    doc.text(doc.splitTextToSize(setLabel, pageW - marginX * 2), marginX, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const windowLine = [
      data.mock.opensAt ? `Opens: ${formatWhen(data.mock.opensAt)}` : null,
      data.mock.closesAt ? `Closes: ${formatWhen(data.mock.closesAt)}` : null,
      `Status: ${data.mock.status}`,
      `Exported: ${formatWhen(data.exportedAt)}`,
    ]
      .filter(Boolean)
      .join('  ·  ');
    doc.text(doc.splitTextToSize(windowLine, pageW - marginX * 2), marginX, y);
    y += 8;

    // Rank | Full Name | Username | Score | Completed At
    const colX = [
      marginX,
      marginX + 14,
      marginX + 90,
      marginX + 150,
      marginX + 172,
    ];
    const rowH = 7;
    const textPadX = 2;
    const textPadY = 4.5;

    const drawHorizontal = (atY: number) => {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(marginX, atY, tableRight, atY);
    };

    const drawVerticals = (topY: number, bottomY: number) => {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      for (const x of colX) {
        doc.line(x, topY, x, bottomY);
      }
      doc.line(tableRight, topY, tableRight, bottomY);
    };

    const drawHeaderRow = () => {
      const top = y;
      const bottom = y + rowH;
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, top, tableRight - marginX, rowH, 'F');
      drawHorizontal(top);
      drawHorizontal(bottom);
      drawVerticals(top, bottom);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Rank', colX[0] + textPadX, top + textPadY);
      doc.text('Full Name', colX[1] + textPadX, top + textPadY);
      doc.text('Username', colX[2] + textPadX, top + textPadY);
      doc.text('Score', colX[3] + textPadX, top + textPadY);
      doc.text('Completed At', colX[4] + textPadX, top + textPadY);
      y = bottom;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
    };

    drawHeaderRow();

    if (data.rows.length === 0) {
      const top = y;
      const bottom = y + rowH;
      drawHorizontal(bottom);
      drawVerticals(top, bottom);
      doc.setTextColor(100, 116, 139);
      doc.text('No student attempts yet.', colX[1] + textPadX, top + textPadY);
      y = bottom;
    }

    for (const row of data.rows) {
      if (y + rowH > pageH - 14) {
        doc.addPage();
        y = 18;
        drawHeaderRow();
      }

      const top = y;
      const bottom = y + rowH;
      drawHorizontal(bottom);
      drawVerticals(top, bottom);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(String(row.rank), colX[0] + textPadX, top + textPadY);
      doc.text((row.fullName || 'Aspirant').slice(0, 42), colX[1] + textPadX, top + textPadY);
      doc.text((row.username || 'aspirant').slice(0, 28), colX[2] + textPadX, top + textPadY);
      doc.text(String(Number(row.score) || 0), colX[3] + textPadX, top + textPadY);
      doc.text(formatWhen(row.completedAt).slice(0, 28), colX[4] + textPadX, top + textPadY);
      y = bottom;
    }

    applyPdfDocumentBranding(doc, logoDataUrl);

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `PrepX Nepal · ${data.rows.length} student${data.rows.length === 1 ? '' : 's'} · staff excluded · no emails`,
        marginX,
        pageH - 8
      );
      doc.text(`Page ${p} of ${totalPages}`, pageW - marginX, pageH - 8, { align: 'right' });
    }

    const fileName = `PrepX_Weekly_Leaderboard_${safeFileName(data.mock.title) || 'Results'}.pdf`;
    doc.save(fileName);
    return { ok: true, fileName };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to build PDF' };
  }
}
