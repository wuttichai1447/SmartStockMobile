import { CLOUD_CONFIG, isCloudConfigured } from '../config/cloud';
import { Product, Transaction } from '../models/Product';
import {
  DatabaseSnapshot,
  exportDatabaseSnapshot,
  importDatabaseSnapshot,
} from '../database/sqlite';

export interface SyncResult {
  pushed: number;
  pulled: number;
}

const restUrl = (table: string): string =>
  `${CLOUD_CONFIG.url.replace(/\/$/, '')}/rest/v1/${table}`;

const baseHeaders = (): Record<string, string> => ({
  apikey: CLOUD_CONFIG.anonKey,
  Authorization: `Bearer ${CLOUD_CONFIG.anonKey}`,
  'Content-Type': 'application/json',
});

const assertConfigured = (): void => {
  if (!isCloudConfigured()) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า Cloud Sync — กรุณาใส่ Supabase URL และ anon key ในไฟล์ src/config/cloud.ts'
    );
  }
};

const upsert = async (table: string, rows: unknown[]): Promise<number> => {
  if (rows.length === 0) {
    return 0;
  }

  const response = await fetch(`${restUrl(table)}?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...baseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`อัปโหลด ${table} ไม่สำเร็จ (${response.status}): ${detail}`);
  }

  return rows.length;
};

/** ส่งข้อมูลในเครื่องขึ้นคลาวด์ (อัปเดตทับด้วย id) */
export const pushToCloud = async (): Promise<number> => {
  assertConfigured();
  const snapshot = exportDatabaseSnapshot();

  const products = await upsert('products', snapshot.products);
  const transactions = await upsert('transactions', snapshot.transactions);

  return products + transactions;
};

/** ดึงข้อมูลจากคลาวด์มาแทนที่ข้อมูลสินค้า/ธุรกรรมในเครื่อง (ไม่แตะข้อมูลผู้ใช้) */
export const pullFromCloud = async (): Promise<number> => {
  assertConfigured();

  const [productsRes, transactionsRes] = await Promise.all([
    fetch(`${restUrl('products')}?select=*`, { headers: baseHeaders() }),
    fetch(`${restUrl('transactions')}?select=*`, { headers: baseHeaders() }),
  ]);

  if (!productsRes.ok || !transactionsRes.ok) {
    throw new Error('ดึงข้อมูลจากคลาวด์ไม่สำเร็จ');
  }

  const products = (await productsRes.json()) as Product[];
  const transactions = (await transactionsRes.json()) as Omit<
    Transaction,
    'productName'
  >[];

  const snapshot: DatabaseSnapshot = {
    products,
    transactions,
    users: [],
  };

  importDatabaseSnapshot(snapshot);
  return products.length + transactions.length;
};

export const syncWithCloud = async (): Promise<SyncResult> => {
  const pushed = await pushToCloud();
  const pulled = await pullFromCloud();
  return { pushed, pulled };
};

export { isCloudConfigured };
