import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// import type { FieldMap, FieldSpec } from "./fieldMap"; // adjust import path if needed

import type {
  FieldMap,
  FieldSpec,
} from "@/app/[locale]/(app)/forms/child-registration-request/fieldMap";

export type FillOptionsClient = {
  /** Provide bytes (fetched in the browser) for Hebrew-capable font */
  fontBytes?: Uint8Array;
  defaultFontSize?: number;
  textColor?: { r: number; g: number; b: number };
  autoDetectRtl?: boolean;
  defaultRtlAlignRight?: boolean;
};

export async function fillFieldsToNewPdfBytesClient(
  inputPdfBytes: Uint8Array,
  fields: Record<string, string>,
  fieldMap: FieldMap,
  options: FillOptionsClient = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(inputPdfBytes);

  // === Font setup ===
  let font: PDFFont;
  if (options.fontBytes) {
    pdfDoc.registerFontkit(fontkit);
    font = await pdfDoc.embedFont(options.fontBytes);
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // === Color ===
  const c = options.textColor ?? { r: 0, g: 0, b: 0 };
  const textColor = rgb(c.r, c.g, c.b);

  const autoDetectRtl = options.autoDetectRtl ?? true;
  const defaultRtlAlignRight = options.defaultRtlAlignRight ?? true;

  for (const [fieldName, rawValue] of Object.entries(fields)) {
    const spec = fieldMap[fieldName];
    if (!spec) {
      // In the client, it’s nicer to skip unknown keys instead of crashing.
      // If you prefer strict, replace with: throw new Error(...)
      continue;
    }

    const page = pdfDoc.getPage(spec.pageIndex);

    const direction =
      spec.direction ??
      (autoDetectRtl && containsHebrew(rawValue) ? "rtl" : "ltr");

    const align =
      spec.align ??
      (direction === "rtl" && defaultRtlAlignRight && spec.width
        ? "right"
        : "left");

    const baseFontSize = spec.fontSize ?? options.defaultFontSize ?? 12;

    const rendered =
      direction === "rtl"
        ? rawValue
        : direction === "ltr" && containsHebrew(rawValue)
        ? rtlVisualize(rawValue)
        : rawValue;

    const lines = rendered.split(/\r?\n/);

    const fittedFontSize = fitFontSizeToWidth(font, lines, spec, baseFontSize);

    if (spec.clearBackground && (spec.width || spec.height)) {
      const bgWidth = spec.width ?? maxLineWidth(font, lines, fittedFontSize);
      const bgHeight =
        spec.height ??
        estimateBlockHeight(lines.length, fittedFontSize, spec.lineHeight);

      page.drawRectangle({
        x: spec.x,
        y: spec.y - bgHeight + fittedFontSize * 0.2,
        width: bgWidth,
        height: bgHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(1, 1, 1),
      });
    }

    const lineHeight = spec.lineHeight ?? fittedFontSize * 1.2;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const y = spec.y - i * lineHeight;

      const lineWidth = font.widthOfTextAtSize(line, fittedFontSize);
      const x = computeAlignedX(spec.x, spec.width, align, lineWidth);

      if (spec.kind === "checkbox") {
        // draw X only if value is "truthy"
        if (
          rawValue &&
          rawValue.trim() !== "" &&
          rawValue !== "false" &&
          rawValue !== "0"
        ) {
          const size = spec.boxSize ?? 10;
          const w = spec.strokeWidth ?? 1;
          const half = size / 2;

          page.drawLine({
            start: { x: spec.x - half, y: spec.y - half },
            end: { x: spec.x + half, y: spec.y + half },
            thickness: w,
          });
          page.drawLine({
            start: { x: spec.x - half, y: spec.y + half },
            end: { x: spec.x + half, y: spec.y - half },
            thickness: w,
          });
        }
        continue; // don't do text rendering
      }

      page.drawText(line, {
        x,
        y,
        size: fittedFontSize,
        font,
        color: textColor,
      });
    }
  }

  return await pdfDoc.save();
}

/* ========= Helpers (copied from your fillPdf.ts, no fs) ========= */

function containsHebrew(s: string) {
  return /[\u0590-\u05FF]/.test(s);
}

function rtlVisualize(input: string) {
  if (/^[\u0590-\u05FF\s.,\-–—"'\(\)\[\]\/\\:;!?0-9]+$/.test(input)) {
    return reverseGraphemes(input);
  }

  const tokens = input.match(
    /[\u0590-\u05FF]+|[A-Za-z0-9]+|[^\u0590-\u05FFA-Za-z0-9]+/g
  );
  if (!tokens) return input;

  const processed = tokens.map((t) =>
    /[\u0590-\u05FF]/.test(t) ? reverseGraphemes(t) : t
  );

  return processed.reverse().join("");
}

function reverseGraphemes(s: string) {
  const Seg = (Intl as any).Segmenter;
  if (!Seg) return s.split("").reverse().join("");
  const seg = new Seg("he", { granularity: "grapheme" });
  const parts = Array.from(seg.segment(s), (x: any) => x.segment);
  return parts.reverse().join("");
}

function computeAlignedX(
  x: number,
  width: number | undefined,
  align: "left" | "center" | "right",
  textWidth: number
) {
  if (!width || align === "left") return x;
  if (align === "center") return x + (width - textWidth) / 2;
  return x + (width - textWidth);
}

function fitFontSizeToWidth(
  font: PDFFont,
  lines: string[],
  spec: FieldSpec,
  fallback: number
) {
  if (!spec.width) return fallback;

  // const maxSize = spec.maxFontSize ?? fallback;
  // const minSize = spec.minFontSize ?? 6;

  const maxSize = 12;
  const minSize = 6;



  let size = maxSize;
  while (size > minSize) {
    const widest = maxLineWidth(font, lines, size);
    if (widest <= spec.width) return size;
    size -= 0.5;
  }
  return minSize;
}

function maxLineWidth(font: PDFFont, lines: string[], fontSize: number) {
  let max = 0;
  for (const line of lines) {
    const w = font.widthOfTextAtSize(line, fontSize);
    if (w > max) max = w;
  }
  return max;
}

function estimateBlockHeight(
  lineCount: number,
  fontSize: number,
  lineHeight?: number
) {
  const lh = lineHeight ?? fontSize * 1.2;
  return Math.max(fontSize * 1.35, (lineCount - 1) * lh + fontSize * 1.35);
}
