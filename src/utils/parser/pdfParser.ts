import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ParseProgress {
  stage: 'reading' | 'extracting' | 'ocr' | 'completed' | 'error';
  currentPage: number;
  totalPages: number;
  percent: number;
  message: string;
}

export type ProgressCallback = (progress: ParseProgress) => void;

/**
 * Extracts plain text from a PDF file using PDF.js with OCR fallback for scanned documents
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ text: string; pageCount: number; usedOCR: boolean }> {
  try {
    onProgress?.({
      stage: 'reading',
      currentPage: 0,
      totalPages: 0,
      percent: 5,
      message: 'Reading PDF document...',
    });

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    let fullText = '';
    let totalChars = 0;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({
        stage: 'extracting',
        currentPage: pageNum,
        totalPages,
        percent: Math.round(10 + (pageNum / totalPages) * 70),
        message: `Extracting text from page ${pageNum} of ${totalPages}...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();

      // Sort items by vertical position (top to bottom) then horizontal (left to right)
      // to preserve reading flow even with multi-column or formatted layouts
      const items = content.items as any[];
      let lastY: number | null = null;
      let pageStr = `\n--- Page ${pageNum} ---\n`;

      for (const item of items) {
        if (!item.str) continue;
        const currentY = item.transform ? Math.round(item.transform[5]) : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
          pageStr += '\n';
        } else if (pageStr.length > 0 && !pageStr.endsWith('\n') && !pageStr.endsWith(' ')) {
          pageStr += ' ';
        }

        pageStr += item.str;
        lastY = currentY;
      }

      totalChars += pageStr.trim().length;
      pageTexts.push(pageStr);
    }

    // Check if the document appears to be scanned (average < 40 characters per page)
    const isScanned = totalPages > 0 && totalChars / totalPages < 40;

    if (isScanned) {
      onProgress?.({
        stage: 'ocr',
        currentPage: 0,
        totalPages,
        percent: 80,
        message: 'Scanned document detected. Running OCR image recognition...',
      });

      try {
        const ocrText = await performOcrOnPdf(pdfDoc, totalPages, onProgress);
        onProgress?.({
          stage: 'completed',
          currentPage: totalPages,
          totalPages,
          percent: 100,
          message: 'OCR extraction completed successfully.',
        });
        return { text: ocrText, pageCount: totalPages, usedOCR: true };
      } catch (ocrErr) {
        console.warn('OCR processing failed or timed out, returning direct text:', ocrErr);
      }
    }

    fullText = pageTexts.join('\n\n');

    onProgress?.({
      stage: 'completed',
      currentPage: totalPages,
      totalPages,
      percent: 100,
      message: 'Extraction completed.',
    });

    return {
      text: fullText,
      pageCount: totalPages,
      usedOCR: false,
    };
  } catch (err: any) {
    onProgress?.({
      stage: 'error',
      currentPage: 0,
      totalPages: 0,
      percent: 0,
      message: err?.message || 'Failed to read PDF file',
    });
    throw err;
  }
}

/**
 * Runs Tesseract OCR on rendered canvas of PDF pages
 */
async function performOcrOnPdf(
  pdfDoc: any,
  totalPages: number,
  onProgress?: ProgressCallback
): Promise<string> {
  const worker = await createWorker('eng');
  let ocrResults = '';

  // Limit OCR to first 10 pages for browser performance if very large
  const pagesToScan = Math.min(totalPages, 10);

  for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
    onProgress?.({
      stage: 'ocr',
      currentPage: pageNum,
      totalPages: pagesToScan,
      percent: Math.round(80 + (pageNum / pagesToScan) * 18),
      message: `Running OCR on page ${pageNum} of ${pagesToScan}...`,
    });

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      const { data: { text } } = await worker.recognize(canvas);
      ocrResults += `\n--- Page ${pageNum} ---\n` + text;
    }
  }

  await worker.terminate();
  return ocrResults;
}
