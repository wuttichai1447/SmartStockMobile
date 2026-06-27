import { Platform } from 'react-native';
import JsBarcode from 'jsbarcode';
import { formatCurrency } from './helpers';

export interface BarcodeLabelData {
  productName: string;
  barcode: string;
  price?: number;
  unit?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildLabelHtml = (data: BarcodeLabelData, svgMarkup: string): string => {
  const priceLine =
    data.price !== undefined && data.unit
      ? `<p class="price">${escapeHtml(formatCurrency(data.price))} / ${escapeHtml(data.unit)}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>บาร์โค้ด ${escapeHtml(data.barcode)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #fff;
    }
    .label {
      width: 280px;
      padding: 16px;
      border: 2px dashed #2E7D32;
      border-radius: 12px;
      text-align: center;
    }
    .market { font-size: 12px; color: #546E7A; margin-bottom: 4px; }
    .name {
      font-size: 16px;
      font-weight: 700;
      color: #1B5E20;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .price { font-size: 14px; font-weight: 600; color: #2E7D32; margin-bottom: 10px; }
    .barcode { display: flex; justify-content: center; margin: 8px 0; }
    .barcode svg { max-width: 100%; height: auto; }
    .code {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 6px;
      color: #1B5E20;
    }
    @media print {
      body { min-height: auto; }
      .label { border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="label">
    <p class="market">ตลาด</p>
    <p class="name">${escapeHtml(data.productName)}</p>
    ${priceLine}
    <div class="barcode">${svgMarkup}</div>
    <p class="code">${escapeHtml(data.barcode)}</p>
  </div>
</body>
</html>`;
};

export const createBarcodeSvg = (barcode: string): string => {
  if (typeof document === 'undefined') {
    return '';
  }

  const trimmed = barcode.trim();
  if (!trimmed) {
    throw new Error('ไม่มีรหัสบาร์โค้ด');
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, trimmed, {
    format: 'CODE128',
    width: 2,
    height: 72,
    displayValue: false,
    margin: 8,
  });

  return svg.outerHTML;
};

const printHtmlInHiddenFrame = (html: string): void => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  );
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    document.body.removeChild(iframe);
    throw new Error('ไม่สามารถเตรียมหน้าพิมพ์ได้');
  }

  const doc = frameWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  const triggerPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    setTimeout(cleanup, 1500);
  };

  setTimeout(triggerPrint, 200);
};

export const printBarcodeLabel = (data: BarcodeLabelData): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('การพิมพ์บาร์โค้ดรองรับบน Web เท่านั้น');
  }

  const svgMarkup = createBarcodeSvg(data.barcode);
  const html = buildLabelHtml(data, svgMarkup);
  printHtmlInHiddenFrame(html);
};
