import { Platform } from 'react-native';
import { Sale } from '../models/Product';
import { formatCurrency, formatDate } from './helpers';
import { LABELS } from './constants';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildReceiptHtml = (sale: Sale): string => {
  const rows = (sale.items ?? [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.productName)}<br/><span class="muted">${item.quantity} ${escapeHtml(
        item.unit
      )} × ${escapeHtml(formatCurrency(item.unitPrice))}</span></td>
        <td class="right">${escapeHtml(formatCurrency(item.lineTotal))}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>ใบเสร็จ #${sale.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #fff; color: #1B5E20; }
    .receipt { width: 300px; margin: 0 auto; padding: 16px; }
    .center { text-align: center; }
    .shop { font-size: 18px; font-weight: 800; }
    .muted { color: #546E7A; font-size: 11px; }
    .meta { font-size: 12px; color: #546E7A; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td { padding: 6px 0; vertical-align: top; font-size: 13px; border-bottom: 1px dashed #ddd; }
    .right { text-align: right; white-space: nowrap; }
    .totals { margin-top: 10px; font-size: 14px; }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .grand { font-weight: 800; font-size: 16px; border-top: 2px solid #1B5E20; margin-top: 6px; padding-top: 6px; }
    .thanks { margin-top: 14px; font-size: 12px; }
    @media print { .receipt { width: auto; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="shop">${escapeHtml(LABELS.appName)}</div>
      <div class="muted">${escapeHtml(LABELS.marketName)}</div>
    </div>
    <div class="meta">
      ใบเสร็จ #${sale.id}<br/>
      ${escapeHtml(formatDate(sale.createdAt))}<br/>
      ผู้ขาย: ${escapeHtml(sale.soldByName || '-')}
    </div>
    <table><tbody>${rows}</tbody></table>
    <div class="totals">
      <div class="row"><span>รวม</span><span>${escapeHtml(formatCurrency(sale.subtotal))}</span></div>
      ${
        sale.discount > 0
          ? `<div class="row"><span>ส่วนลด</span><span>-${escapeHtml(formatCurrency(sale.discount))}</span></div>`
          : ''
      }
      <div class="row grand"><span>สุทธิ</span><span>${escapeHtml(formatCurrency(sale.total))}</span></div>
      <div class="row"><span>รับเงิน</span><span>${escapeHtml(formatCurrency(sale.received))}</span></div>
      <div class="row"><span>เงินทอน</span><span>${escapeHtml(formatCurrency(sale.change))}</span></div>
    </div>
    <div class="center thanks">ขอบคุณที่ใช้บริการ</div>
  </div>
</body>
</html>`;
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

  setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    setTimeout(cleanup, 1500);
  }, 200);
};

export const printReceipt = (sale: Sale): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('การพิมพ์ใบเสร็จรองรับบน Web เท่านั้น');
  }
  printHtmlInHiddenFrame(buildReceiptHtml(sale));
};
