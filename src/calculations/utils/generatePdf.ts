import { seller } from "../../config/checkoutConfig";
import { CalculatedFurnitureMaterial } from "../calculateFurnitureMaterials";
import { CalculatedSystemMaterial } from "../calculateSystemMaterials";
import { CalculatorInput } from "../types";


export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/** Use only the first SKU from compound codes like "M10-30/M10-pov/M10-VS" */
function shortCode(code: string): string {
  return (code ?? "").split("/")[0].trim();
}

function getPriceFromMap(code: string, map: Record<string, number>): number | null {
  return map[shortCode(code)] ?? null;
}

/** Draw a filled+stroked rectangle */
function fillStrokeRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill?: string, stroke?: string, lw = 0.5,
) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  if (fill)   { ctx.fillStyle = fill;     ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

/**
 * Draw text clipped inside a cell rectangle.
 * `px` / `py` are absolute text positions.
 */
function cellText(
  ctx: CanvasRenderingContext2D,
  text: string,
  px: number, py: number,
  clipX: number, clipY: number, clipW: number, clipH: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX + 1, clipY + 1, clipW - 2, clipH - 2);
  ctx.clip();
  ctx.fillText(text, px, py);
  ctx.restore();
}

// ─── document title & offer number ───────────────────────────────────────────

function getDocTitle(input: CalculatorInput): { header: string; sub: string } {
  switch (input.batteryType) {
    case "ezys":
      return {
        header: "ANTŽEMINĖ SAULĖS MODULIŲ MONTAVIMO SISTEMA",
        sub: "Ežio saulės modulių montavimo sistema",
      };
    case "poline":
      return {
        header: "ANTŽEMINĖ SAULĖS MODULIŲ MONTAVIMO SISTEMA",
        sub: "Polinė saulės modulių montavimo sistema",
      };
    case "ploksciasStogas":
      return {
        header: "PLOKŠČIO STOGO SAULĖS MODULIŲ MONTAVIMO SISTEMA",
        sub: `Sistema: ${input.system ?? ""}  |  Orientacija: ${input.orientation ?? ""}`,
      };
    case "slaitinisStogas":
      return {
        header: "ŠLAITINIO STOGO SAULĖS MODULIŲ MONTAVIMO SISTEMA",
        sub: `Stogo danga: ${input.roofMaterial ?? ""}  |  Montavimo būdas: ${input.mountingMethod ?? ""}`,
      };
    default:
      return { header: "SAULĖS MODULIŲ MONTAVIMO SISTEMA", sub: "" };
  }
}

function getOrderNum(): string {
  const d = new Date();
  return `MK${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-1`;
}


const W      = 794;
const MARGIN = 40;
const COL_W  = W - MARGIN * 2;
const FONT   = '"Segoe UI", Arial, sans-serif';
const BRAND  = "#1a3a5c";
const LIGHT  = "#e8f0f8";
const BORDER = "#9ab0c8";
const TEXT   = "#1a1a1a";
const MUTED  = "#666";
const ROW_H  = 18;

function drawPageHeader(
  ctx: CanvasRenderingContext2D,
  buyer: BuyerInfo,
  input: CalculatorInput,
  offerNum: string,
  startY: number,
): number {
  let y = startY;
  const { header, sub } = getDocTitle(input);

  // Title band
  fillStrokeRect(ctx, MARGIN, y, COL_W, 36, BRAND);
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(header, W / 2, y + 23);
  y += 40;

  // Sub-title
  if (sub) {
    fillStrokeRect(ctx, MARGIN, y, COL_W, 22, LIGHT, BORDER);
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = BRAND;
    ctx.textAlign = "center";
    ctx.fillText(sub, W / 2, y + 15);
    y += 26;
  }

  // Offer number
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillStyle = TEXT;
  ctx.textAlign = "right";
  ctx.fillText(`Komercinis pasiūlymas Nr. ${offerNum}`, MARGIN + COL_W, y + 13);
  y += 22;

  // Seller / Buyer boxes
  const HALF = Math.floor(COL_W / 2) - 4;

  fillStrokeRect(ctx, MARGIN, y, HALF, 120, LIGHT, BORDER);
  ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = BRAND; ctx.textAlign = "left";
  ctx.fillText("PARDAVĖJAS", MARGIN + 8, y + 14);
  ctx.font = `9.5px ${FONT}`; ctx.fillStyle = TEXT;
  [
    seller.name,
    `Įm. kodas: ${seller.companyCode}`,
    `PVM kodas: ${seller.vatCode}`,
    `Adresas: ${seller.address}`,
    `Tel.: ${seller.phone}`,
    `El. paštas: ${seller.email}`,
    `A.s.: ${seller.iban}  |  ${seller.bank}`,
  ].forEach((ln, i) => ctx.fillText(ln, MARGIN + 8, y + 28 + i * 13));

  const bx = MARGIN + HALF + 8;
  fillStrokeRect(ctx, bx, y, HALF, 120, LIGHT, BORDER);
  ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = BRAND; ctx.textAlign = "left";
  ctx.fillText("PIRKĖJAS", bx + 8, y + 14);
  ctx.font = `9.5px ${FONT}`; ctx.fillStyle = TEXT;
  [buyer.name, `Tel.: ${buyer.phone}`, `El. paštas: ${buyer.email}`]
    .forEach((ln, i) => ctx.fillText(ln, bx + 8, y + 28 + i * 18));

  return y + 128;
}

// ─── generic table renderer ───────────────────────────────────────────────────

type Align = "center" | "left" | "right";

interface ColDef {
  label: string;
  width: number;
  align: Align;
}

interface RowCell {
  text: string;
  align?: Align;
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  startY: number,
  cols: ColDef[],
  rows: RowCell[][],
  totalWidth: number,
): number {
  let y = startY;

  // Header
  fillStrokeRect(ctx, x, y, totalWidth, ROW_H, BRAND);
  ctx.font = `bold 8px ${FONT}`;
  ctx.fillStyle = "#fff";
  let cx = x;
  for (const col of cols) {
    const tx = col.align === "left" ? cx + 3 : cx + col.width / 2;
    ctx.textAlign = col.align === "left" ? "left" : "center";
    cellText(ctx, col.label, tx, y + 12, cx, y, col.width, ROW_H);
    cx += col.width;
  }
  y += ROW_H;

  // Data rows
  ctx.font = `8.5px ${FONT}`;
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const isTotalRow = row[0]?.text === "__total__";

    const rowFill = isTotalRow ? LIGHT : ri % 2 === 0 ? "#ffffff" : "#f3f7fb";
    fillStrokeRect(ctx, x, y, totalWidth, ROW_H, rowFill, BORDER);

    if (isTotalRow) {
      ctx.font = `bold 8.5px ${FONT}`;
    } else {
      ctx.font = `8.5px ${FONT}`;
    }

    let dcx = x;
    for (let ci = 0; ci < cols.length; ci++) {
      const col  = cols[ci];
      const cell = row[ci] ?? { text: "" };
      const align = isTotalRow
        ? (ci === cols.length - 2 ? "right" : ci === cols.length - 1 ? "center" : "left")
        : (cell.align ?? col.align);

      if (isTotalRow && ci < cols.length - 2) {
        dcx += col.width;
        continue;
      }

      ctx.fillStyle = isTotalRow ? BRAND : TEXT;
      ctx.textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";

      let tx: number;
      if (align === "left")  tx = dcx + 3;
      else if (align === "right") tx = dcx + col.width - 3;
      else tx = dcx + col.width / 2;

      cellText(ctx, cell.text, tx, y + 12, dcx, y, col.width, ROW_H);
      dcx += col.width;
    }
    y += ROW_H;
  }

  return y;
}

// ─── Page 1: materials ────────────────────────────────────────────────────────

function buildMaterialsPage(
  buyer: BuyerInfo,
  input: CalculatorInput,
  systemMaterials: CalculatedSystemMaterial[],
  furnitureMaterials: CalculatedFurnitureMaterial[],
  offerNum: string,
): HTMLCanvasElement {
  const SCALE    = 2;
  const isGround = input.batteryType === "ezys" || input.batteryType === "poline";
  const prices   = input.productPrices ?? {};
  const hasPrices = true; // always show price columns

  // ── Column layout ──────────────────────────────────────────────────────────
  // Fixed cols first, name gets the remainder
  const cNr    = 26;
  const cCode  = 52;   // show only first SKU (e.g. "M10-30"), fits comfortably
  const cQty   = 44;
  const cLen   = isGround ? 52 : 0;
  const cPrice = hasPrices ? 64 : 0;
  const cSum   = hasPrices ? 68 : 0;
  const cName  = COL_W - cNr - cCode - cQty - cLen - cPrice - cSum;

  const sysCols: ColDef[] = [
    { label: "Nr.",          width: cNr,    align: "center" },
    { label: "Kodas",        width: cCode,  align: "center" },
    { label: "Pavadinimas",  width: cName,  align: "left"   },
    { label: "Kiekis",       width: cQty,   align: "center" },
    ...(isGround ? [{ label: "Ilgis, mm", width: cLen, align: "center" as Align }] : []),
    ...(hasPrices ? [
      { label: "Kaina, €", width: cPrice, align: "center" as Align },
      { label: "Suma, €",  width: cSum,   align: "center" as Align },
    ] : []),
  ];

  let sysTotal = 0;
  const sysRows: RowCell[][] = systemMaterials.map((m, i) => {
    const price  = getPriceFromMap(m.code ?? "", prices);
    const rowSum = price != null ? price * m.quantity : null;
    if (rowSum != null) sysTotal += rowSum;
    return [
      { text: String(i + 1) },
      { text: shortCode(m.code ?? "") },
      { text: m.name, align: "left" },
      { text: String(m.quantity) },
      ...(isGround ? [{ text: m.length != null ? String(m.length) : "–" }] : []),
      ...(hasPrices ? [
        { text: fmt(price ?? 0) },
        { text: fmt(rowSum ?? 0) },
      ] : []),
    ];
  });

  if (hasPrices) {
    // Sentinel row handled by drawTable
    const emptyCount = sysCols.length - 2;
    sysRows.push([
      { text: "__total__" },
      ...Array(emptyCount - 1).fill({ text: "" }),
      { text: "Viso:" },
      { text: fmt(sysTotal) + " €" },
    ]);
  }

  // Furniture table
  const fCode  = 52;
  const fQty   = 44;
  const fPrice2 = hasPrices ? 64 : 0;
  const fSum2   = hasPrices ? 68 : 0;
  const fName   = COL_W - cNr - fCode - fQty - fPrice2 - fSum2;

  const furnCols: ColDef[] = [
    { label: "Nr.",         width: cNr,    align: "center" },
    { label: "Kodas",       width: fCode,  align: "center" },
    { label: "Pavadinimas", width: fName,  align: "left"   },
    { label: "Kiekis",      width: fQty,   align: "center" },
    ...(hasPrices ? [
      { label: "Kaina, €",  width: fPrice2, align: "center" as Align },
      { label: "Suma, €",   width: fSum2,   align: "center" as Align },
    ] : []),
  ];

  let furnTotal = 0;
  const furnRows: RowCell[][] = furnitureMaterials.map((m, i) => {
    const skuMatch = m.name.match(/\(([^)]+)\)$/);
    const sku      = skuMatch ? skuMatch[1] : "";
    const price    = prices[sku] ?? null;
    const rowSum   = price != null ? price * m.quantity : null;
    if (rowSum != null) furnTotal += rowSum;
    // Strip "(SKU)" from display name
    const displayName = m.name.replace(/\s*\([^)]+\)$/, "");
    return [
      { text: String(i + 1) },
      { text: sku },
      { text: displayName, align: "left" },
      { text: String(m.quantity) },
      ...(hasPrices ? [
        { text: fmt(price ?? 0) },
        { text: fmt(rowSum ?? 0) },
      ] : []),
    ];
  });

  if (hasPrices) {
    const emptyCount = furnCols.length - 2;
    furnRows.push([
      { text: "__total__" },
      ...Array(emptyCount - 1).fill({ text: "" }),
      { text: "Viso:" },
      { text: fmt(furnTotal) + " €" },
    ]);
  }

  // ── Estimate canvas height ─────────────────────────────────────────────────
  const hdrH    = 40 + 26 + 22 + 128;
  const secH    = 22; // section title
  const sysH    = ROW_H * (sysRows.length + 1);
  const furnH   = isGround ? ROW_H * (furnRows.length + 1) + secH : 0;
  const grandH  = hasPrices ? 30 : 0;
  const footerH = 40;
  const H       = Math.max(1123, MARGIN + hdrH + secH + sysH + 14 + furnH + grandH + footerH + 20);

  const canvas  = document.createElement("canvas");
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx     = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  let y = MARGIN;
  y = drawPageHeader(ctx, buyer, input, offerNum, y);

  // ── System table ───────────────────────────────────────────────────────────
  ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = BRAND; ctx.textAlign = "left";
  ctx.fillText("SISTEMOS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS", MARGIN, y + 14);
  y += 22;
  y = drawTable(ctx, MARGIN, y, sysCols, sysRows, COL_W);
  y += 14;

  // ── Furniture table (ground only) ──────────────────────────────────────────
  if (isGround && furnitureMaterials.length > 0) {
    ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = BRAND; ctx.textAlign = "left";
    ctx.fillText("FURNITŪROS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS", MARGIN, y + 14);
    y += 22;
    y = drawTable(ctx, MARGIN, y, furnCols, furnRows, COL_W);
    y += 14;
  }

  // ── Grand total band ───────────────────────────────────────────────────────
  const grand = sysTotal + furnTotal;
  if (hasPrices) {
    fillStrokeRect(ctx, MARGIN, y, COL_W, 24, BRAND);
    ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = "#fff"; ctx.textAlign = "right";
    ctx.fillText(`Bendra suma be PVM:   ${fmt(grand)} €`, MARGIN + COL_W - 10, y + 16);
    y += 30;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  // y += 8;
  // ctx.font = `8.5px ${FONT}`; ctx.fillStyle = MUTED; ctx.textAlign = "left";
  // // ctx.fillText("* Užsakyti galima sumokant nurodytais rekvizitais, būtina nurodyti pasiūlymo numerį.", MARGIN, y);
  // // ctx.fillText("* Pasiūlymas galioja 5 d.d.", MARGIN, y + 14);

  return canvas;
}

// ─── Page 2: canvas layout drawing ───────────────────────────────────────────

function buildCanvasPage(
  canvasDataUrl: string,
  buyer: BuyerInfo,
  input: CalculatorInput,
  offerNum: string,
): Promise<HTMLCanvasElement> {
  const H = 1123;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);

      let y = MARGIN;
      y = drawPageHeader(ctx, buyer, input, offerNum, y);

      ctx.font = `bold 10px ${FONT}`; ctx.fillStyle = BRAND; ctx.textAlign = "left";
      ctx.fillText("UŽSAKYMO SCHEMA (brėžinys)", MARGIN, y + 14);
      y += 22;

      const availW = COL_W;
      const availH = H - y - 50;
      const aspect = img.naturalWidth / img.naturalHeight;
      let dw = availW;
      let dh = dw / aspect;
      if (dh > availH) { dh = availH; dw = dh * aspect; }
      const dx = MARGIN + (availW - dw) / 2;

      fillStrokeRect(ctx, dx - 1, y - 1, dw + 2, dh + 2, undefined, BORDER);
      ctx.drawImage(img, dx, y, dw, dh);

      resolve(canvas);
    };
    img.onerror = () => resolve(document.createElement("canvas"));
    img.src = canvasDataUrl;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateCommercialProposalPdf(
  buyer: BuyerInfo,
  input: CalculatorInput,
  systemMaterials: CalculatedSystemMaterial[],
  furnitureMaterials: CalculatedFurnitureMaterial[],
): Promise<void> {
  const offerNum = getOrderNum();

  const page1 = buildMaterialsPage(buyer, input, systemMaterials, furnitureMaterials, offerNum);

  const page2 = input.canvasImageDataUrl
    ? await buildCanvasPage(input.canvasImageDataUrl, buyer, input, offerNum)
    : null;

  const imgs = [page1, ...(page2 ? [page2] : [])].map((c) => c.toDataURL("image/png"));

  const pw = window.open("", "_blank");
  if (!pw) { alert("Prašome leisti iššokančius langus šiam puslapiui."); return; }

  pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Komercinis pasiūlymas Nr. ${offerNum}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#ccc;font-family:Arial,sans-serif}
    .toolbar{display:flex;gap:12px;justify-content:center;align-items:center;
             padding:14px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);
             position:sticky;top:0;z-index:10}
    .toolbar span{font-size:13px;color:#555}
    .btn{padding:10px 24px;font-size:13px;font-weight:600;border:none;border-radius:6px;cursor:pointer}
    .btn-print{background:#1a3a5c;color:#fff}
    .btn-close{background:#ddd;color:#333}
    .page{width:210mm;margin:16px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.25)}
    img{width:100%;display:block}
    @media print{
      @page{size:A4 portrait;margin:0}
      .toolbar{display:none}
      body{background:#fff}
      .page{width:100%;margin:0;box-shadow:none;page-break-after:always}
      .page:last-child{page-break-after:auto}
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn btn-print" onclick="window.print()">Išsaugoti PDF</button>
    <span>${imgs.length} puslapis(-iai)</span>
    <button class="btn btn-close" onclick="window.close()">✕ Uždaryti</button>
  </div>
  ${imgs.map((src) => `<div class="page"><img src="${src}"/></div>`).join("\n")}
</body>
</html>`);
  pw.document.close();
}
