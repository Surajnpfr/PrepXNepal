import { jsPDF } from 'jspdf';
import type { AttemptReport } from '../types';
import { resolvePaper } from './reportPaper';

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || '', maxWidth) as string[];
}

/**
 * Downloads a real PDF question paper (.pdf file).
 * Correct options are filled green; wrong student picks are filled light red.
 */
export function downloadQuestionPaperPdf(
  report: AttemptReport
): { ok: true } | { ok: false; error: string } {
  const paper = resolvePaper(report);
  if (!paper) {
    return {
      ok: false,
      error:
        'Question paper data is not saved for this report. Complete a new mock attempt, then download PDF from that report.',
    };
  }

  const { questions, answers } = paper;
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

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titleLines = wrapText(doc, report.mockTitle, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Question paper + answer key  ·  Score ${report.overallScore}/${report.maxScore}  ·  ${report.completedAt}  ·  ${questions.length} Qs`,
    margin,
    y
  );
  y += 6;

  doc.setFontSize(8);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin, y - 3.5, 28, 5, 1, 1, 'F');
  doc.setTextColor(22, 101, 52);
  doc.text('Correct answer', margin + 1.5, y);
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(margin + 32, y - 3.5, 34, 5, 1, 1, 'F');
  doc.setTextColor(153, 27, 27);
  doc.text('Your wrong answer', margin + 33.5, y);
  y += 8;

  const keys = ['A', 'B', 'C', 'D'] as const;

  questions.forEach((q, idx) => {
    const stemLines = wrapText(doc, `Q${idx + 1}. ${q.stem}`, contentW);
    const meta = `${q.subject} · ${q.chapter}`;
    const optBlocks = keys.map((key) => {
      const line = `${key}. ${q.options[key] || ''}`;
      return { key, lines: wrapText(doc, line, contentW - 4) };
    });

    const blockH =
      5 + // meta
      stemLines.length * 4.5 +
      2 +
      optBlocks.reduce((s, b) => s + b.lines.length * 4.2 + 3.5, 0) +
      4;

    ensureSpace(Math.min(blockH, pageH - margin * 2));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(meta, margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(stemLines, margin, y);
    y += stemLines.length * 4.5 + 2;

    if (q.imageUrl) {
      ensureSpace(8);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      const figLines = wrapText(doc, `[Figure] ${q.imageUrl}`, contentW);
      doc.text(figLines, margin, y);
      y += figLines.length * 4 + 2;
    }

    const userAns = answers[q.id];
    optBlocks.forEach(({ key, lines }) => {
      const isCorrect = q.correctOptionKey === key;
      const isUserWrong = userAns === key && !isCorrect;
      const optImg = q.optionImages?.[key];
      const extra = optImg ? 4 : 0;
      const boxH = lines.length * 4.2 + 2.5 + extra;
      ensureSpace(boxH + 2);

      if (isCorrect) {
        doc.setFillColor(220, 252, 231); // green-100
        doc.setDrawColor(134, 239, 172);
      } else if (isUserWrong) {
        doc.setFillColor(254, 226, 226); // red-100
        doc.setDrawColor(252, 165, 165);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
      }
      doc.roundedRect(margin, y - 3.2, contentW, boxH, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
      doc.setFontSize(9);
      if (isCorrect) doc.setTextColor(20, 83, 45);
      else if (isUserWrong) doc.setTextColor(127, 29, 29);
      else doc.setTextColor(30, 41, 59);

      doc.text(lines, margin + 2, y);
      if (optImg) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`[img] ${optImg.slice(0, 60)}`, margin + 2, y + lines.length * 4.2);
      }
      if (isCorrect) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 83, 45);
        doc.text('CORRECT', pageW - margin - 18, y);
      } else if (isUserWrong) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(127, 29, 29);
        doc.text('YOURS', pageW - margin - 14, y);
      }
      y += boxH + 1.2;
    });

    y += 4;
  });

  const safeName = report.mockTitle.replace(/[^\w\-]+/g, '_').slice(0, 60);
  doc.save(`${safeName || 'PrepX_Question_Paper'}_Answer_Key.pdf`);
  return { ok: true };
}
