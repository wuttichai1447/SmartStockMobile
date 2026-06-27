import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
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

const buildPayload = (): BackupPayload => ({
  signature: BACKUP_SIGNATURE,
  version: BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  data: exportDatabaseSnapshot(),
});

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

/** ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON และเปิดหน้าต่างแชร์/บันทึก */
export const exportBackup = async (): Promise<void> => {
  const payload = buildPayload();
  const json = JSON.stringify(payload, null, 2);
  const filename = `smart-stock-backup-${new Date()
    .toISOString()
    .split('T')[0]}.json`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'สำรองข้อมูล Smart Stock',
      UTI: 'public.json',
    });
  } else {
    throw new Error('อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
  }
};

/** เลือกไฟล์สำรองข้อมูลและกู้คืนทับข้อมูลเดิม */
export const importBackup = async (): Promise<boolean> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return false;
  }

  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const snapshot = parsePayload(raw);
  importDatabaseSnapshot(snapshot);
  return true;
};
