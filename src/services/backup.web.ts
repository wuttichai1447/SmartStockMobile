import {
  DatabaseSnapshot,
  exportDatabaseSnapshot,
  importDatabaseSnapshot,
} from '../database/sqlite';

const BACKUP_VERSION = 1;
const BACKUP_SIGNATURE = 'smart-stock-backup';

interface BackupPayload {
  signature: string;
  version: number;
  exportedAt: string;
  data: DatabaseSnapshot;
}

const parsePayload = (raw: string): DatabaseSnapshot => {
  let parsed: BackupPayload;
  try {
    parsed = JSON.parse(raw) as BackupPayload;
  } catch {
    throw new Error('ไฟล์สำรองข้อมูลเสียหายหรือไม่ใช่ไฟล์ JSON');
  }

  if (parsed.signature !== BACKUP_SIGNATURE || !parsed.data) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของ Smart Stock');
  }

  return {
    products: parsed.data.products ?? [],
    transactions: parsed.data.transactions ?? [],
    users: parsed.data.users ?? [],
  };
};

export const exportBackup = async (): Promise<void> => {
  const payload: BackupPayload = {
    signature: BACKUP_SIGNATURE,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: exportDatabaseSnapshot(),
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `smart-stock-backup-${new Date()
    .toISOString()
    .split('T')[0]}.json`;

  if (typeof document === 'undefined') {
    throw new Error('การส่งออกรองรับบนเบราว์เซอร์เท่านั้น');
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const importBackup = async (): Promise<boolean> => {
  if (typeof document === 'undefined') {
    throw new Error('การกู้คืนรองรับบนเบราว์เซอร์เท่านั้น');
  }

  return new Promise<boolean>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const snapshot = parsePayload(String(reader.result ?? ''));
          importDatabaseSnapshot(snapshot);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
      reader.readAsText(file);
    };

    input.click();
  });
};
