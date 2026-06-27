import { Platform } from 'react-native';
import { Transaction } from '../models/Product';

/**
 * รูปแบบวันที่สำหรับส่งออก CSV — Excel อ่านได้ชัด ไม่ใช้ปี พ.ศ. ยาว
 * ตัวอย่าง: 2026-06-25 14:30
 */
export const formatDateForExport = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const escapeCsvCell = (value: string): string => {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
};

export const exportTransactionsToCsv = (transactions: Transaction[]): void => {
  const header = 'วันที่,สินค้า,ประเภท,จำนวน';
  const rows = transactions.map((transaction) => {
    const type = transaction.type === 'IN' ? 'รับเข้า' : 'จ่ายออก';
    const date = formatDateForExport(transaction.createdAt);
    const name = transaction.productName ?? '';
    return [
      escapeCsvCell(date),
      escapeCsvCell(name),
      escapeCsvCell(type),
      escapeCsvCell(String(transaction.quantity)),
    ].join(',');
  });

  const csv = `\uFEFF${header}\n${rows.join('\n')}`;
  const filename = `smart-stock-history-${new Date().toISOString().split('T')[0]}.csv`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  throw new Error('การส่งออก CSV รองรับบน Web เท่านั้น');
};
