import { jsPDF } from 'jspdf';
import type { FormulaSheet } from '../types';
import { formulaPlainPreview, tokenizeFormula, type FormulaToken } from './formulaTokens';

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || '', maxWidth) as string[];
}

function safeFileName(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

/** Draw one line of math tokens with true subscript/superscript baselines. */
function drawFormulaLine(
  doc: jsPDF,
  tokens: FormulaToken[],
  x: number,
  y: number,
  opts: { baseSize?: number; color?: [number, number, number] } = {}
): number {
  const baseSize = opts.baseSize ?? 10;
  const scriptSize = Math.max(6, baseSize * 0.68);
  const color = opts.color ?? ([37, 99, 235] as [number, number, number]);
  let cx = x;

  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');

  for (const t of tokens) {
    if (t.kind === 'text') {
      doc.setFontSize(baseSize);
      doc.text(t.value, cx, y);
      cx += doc.getTextWidth(t.value);
      continue;
    }

    doc.setFontSize(baseSize);
    doc.text(t.base, cx, y);
    cx += doc.getTextWidth(t.base);

    if (t.sub || t.sup) {
      doc.setFontSize(scriptSize);
      const subW = t.sub ? doc.getTextWidth(t.sub) : 0;
      const supW = t.sup ? doc.getTextWidth(t.sup) : 0;
      if (t.sub) doc.text(t.sub, cx + 0.2, y + 1.35);
      if (t.sup) doc.text(t.sup, cx + 0.2, y - 1.55);
      cx += Math.max(subW, supW) + 0.45;
    }

    doc.setFontSize(baseSize);
  }

  return cx - x;
}

function measureFormulaWidth(doc: jsPDF, tokens: FormulaToken[], baseSize = 10): number {
  const scriptSize = Math.max(6, baseSize * 0.68);
  let w = 0;
  doc.setFont('helvetica', 'bold');
  for (const t of tokens) {
    if (t.kind === 'text') {
      doc.setFontSize(baseSize);
      w += doc.getTextWidth(t.value);
      continue;
    }
    doc.setFontSize(baseSize);
    w += doc.getTextWidth(t.base);
    doc.setFontSize(scriptSize);
    if (t.sub) w += doc.getTextWidth(t.sub) + 0.35;
    if (t.sup && !t.sub) w += doc.getTextWidth(t.sup) + 0.35;
    if (t.sup && t.sub) {
      /* stacked — width already includes sub */
    }
  }
  return w;
}

/**
 * Downloads a structured PDF for one formula sheet,
 * mirroring the Formula Library card layout (subject, title, name, formula, note).
 * Formulas use the same tokenizer as the web UI for subscripts/superscripts.
 */
export function downloadFormulaSheetPdf(
  sheet: FormulaSheet,
  options?: { formulas?: FormulaSheet['formulas'] }
): { ok: true } | { ok: false; error: string } {
  const formulas = options?.formulas ?? sheet.formulas;
  if (!formulas.length) {
    return { ok: false, error: 'No formulas to download for this sheet.' };
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Document header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('PrepXNepal Formula Library', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('High-yield CEE revision sheet · offline printable', margin, y);
  y += 8;

  // Subject chip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const subjectLabel = sheet.subject.toUpperCase();
  const chipW = doc.getTextWidth(subjectLabel) + 6;
  doc.setFillColor(219, 234, 254);
  doc.roundedRect(margin, y - 3.5, chipW, 6, 1.2, 1.2, 'F');
  doc.setTextColor(30, 64, 175);
  doc.text(subjectLabel, margin + 3, y);
  y += 8;

  // Sheet title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleLines = wrapText(doc, sheet.title, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 5.5 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${sheet.chapter}  ·  ${formulas.length} formula${formulas.length === 1 ? '' : 's'}`,
    margin,
    y
  );
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  formulas.forEach((f, index) => {
    const nameLines = wrapText(doc, f.name, contentW - 6);
    const tokens = tokenizeFormula(f.formula);
    const preview = formulaPlainPreview(f.formula);
    // Soft-wrap long formulas by splitting on " = " when needed
    const formulaSegments: FormulaToken[][] = [];
    const maxFormulaW = contentW - 12;
    if (measureFormulaWidth(doc, tokens) <= maxFormulaW) {
      formulaSegments.push(tokens);
    } else {
      // Split text tokens on " = " boundaries
      let current: FormulaToken[] = [];
      for (const t of tokens) {
        if (t.kind === 'text' && t.value.includes(' = ')) {
          const parts = t.value.split(/( = )/g);
          for (const part of parts) {
            if (!part) continue;
            if (part === ' = ' && current.length > 0) {
              current.push({ kind: 'text', value: part });
              formulaSegments.push(current);
              current = [];
            } else {
              current.push({ kind: 'text', value: part });
            }
          }
        } else {
          current.push(t);
          if (measureFormulaWidth(doc, current) > maxFormulaW && current.length > 1) {
            const last = current.pop()!;
            formulaSegments.push(current);
            current = [last];
          }
        }
      }
      if (current.length) formulaSegments.push(current);
    }

    const noteLines = f.note ? wrapText(doc, f.note, contentW - 10) : [];
    const nameH = nameLines.length * 4.5;
    const formulaLineH = 5.2;
    const formulaBoxH = Math.max(11, formulaSegments.length * formulaLineH + 6);
    const noteH = noteLines.length > 0 ? noteLines.length * 3.8 + 3 : 0;
    const cardPad = 4;
    const cardH = cardPad + nameH + 3 + formulaBoxH + noteH + cardPad + 2;

    ensureSpace(cardH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'FD');

    let cy = y + cardPad + 3.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`${index + 1}. ${nameLines[0]}`, margin + 3, cy);
    for (let i = 1; i < nameLines.length; i++) {
      cy += 4.5;
      doc.text(nameLines[i], margin + 3 + doc.getTextWidth(`${index + 1}. `), cy);
    }
    cy += 5;

    const formulaBoxY = cy - 3.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 3, formulaBoxY, contentW - 6, formulaBoxH, 1.5, 1.5, 'FD');

    let fy = formulaBoxY + 6;
    formulaSegments.forEach((seg) => {
      drawFormulaLine(doc, seg, margin + 5.5, fy, { baseSize: 10 });
      fy += formulaLineH;
    });
    // Keep preview in PDF metadata sense — unused visually beyond layout
    void preview;
    cy = formulaBoxY + formulaBoxH + 4;

    if (noteLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      noteLines.forEach((line) => {
        doc.text(line, margin + 5, cy);
        cy += 3.8;
      });
    }

    y += cardH + 4;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('PrepXNepal · Formula Library', margin, pageH - 8);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 8, {
      align: 'right',
    });
  }

  const file = `PrepX_${sheet.subject}_${safeFileName(sheet.title) || 'Formula_Sheet'}.pdf`;
  doc.save(file);
  return { ok: true };
}
