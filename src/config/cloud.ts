/**
 * ตั้งค่า Cloud Sync (Supabase)
 * ------------------------------------------------------------------
 * แอปนี้เก็บข้อมูลในเครื่อง (SQLite) เป็นหลัก ส่วน Cloud Sync เป็นทางเลือก
 * เพื่อสำรอง/ซิงค์ข้อมูลขึ้นเซิร์ฟเวอร์กลาง ให้ใช้งานได้หลายเครื่อง
 *
 * วิธีเปิดใช้งาน:
 *   1) สร้างโปรเจกต์ฟรีที่ https://supabase.com
 *   2) สร้างตาราง `products` และ `transactions` (ดู SQL ตัวอย่างด้านล่าง)
 *   3) คัดลอก Project URL และ anon public key มาวางด้านล่าง
 *      หรือกำหนดผ่านตัวแปรแวดล้อม EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * SQL ตัวอย่างสำหรับสร้างตารางบน Supabase:
 *   create table products (
 *     id bigint primary key,
 *     "productName" text not null,
 *     category text,
 *     quantity numeric,
 *     barcode text,
 *     unit text,
 *     "imageUri" text,
 *     price numeric,
 *     "minStock" numeric,
 *     "expiryDate" text,
 *     "createdAt" text,
 *     "updatedAt" timestamptz default now()
 *   );
 *   create table transactions (
 *     id bigint primary key,
 *     "productId" bigint,
 *     type text,
 *     quantity numeric,
 *     "createdAt" text
 *   );
 */

export interface CloudConfig {
  url: string;
  anonKey: string;
  /** ชื่อร้าน/อุปกรณ์ ใช้แยกข้อมูลแต่ละสาขา (optional) */
  workspaceId?: string;
}

const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const CLOUD_CONFIG: CloudConfig = {
  url: ENV_URL,
  anonKey: ENV_KEY,
  workspaceId: process.env.EXPO_PUBLIC_SUPABASE_WORKSPACE ?? 'default',
};

export const isCloudConfigured = (): boolean =>
  Boolean(CLOUD_CONFIG.url && CLOUD_CONFIG.anonKey);
