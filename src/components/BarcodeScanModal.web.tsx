import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { DEMO_BARCODES } from '../utils/sampleProducts';

interface BarcodeScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
  title?: string;
}

const BarcodeScanModal: React.FC<BarcodeScanModalProps> = ({
  visible,
  onClose,
  onScanned,
  title = 'สแกนบาร์โค้ด',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setManualCode('');
      setCameraReady(false);
      setCameraError(false);
      requestedRef.current = false;
      return;
    }

    if (!permission?.granted && !requestedRef.current) {
      requestedRef.current = true;
      requestPermission();
    }
  }, [visible, permission?.granted, requestPermission]);

  const finishScan = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      onScanned(trimmed);
      onClose();
    },
    [onClose, onScanned]
  );

  const handleScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);
      finishScan(data);
    },
    [finishScan, scanned]
  );

  const showCamera = permission?.granted && !cameraError;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {showCamera ? (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'qr',
                    'ean13',
                    'ean8',
                    'code128',
                    'code39',
                    'upc_a',
                    'upc_e',
                  ],
                }}
                onBarcodeScanned={scanned ? undefined : handleScanned}
                onCameraReady={() => setCameraReady(true)}
                onMountError={() => setCameraError(true)}
              />
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.hint}>
                  {cameraReady ? 'วางบาร์โค้ดในกรอบ' : 'กำลังเปิดกล้อง...'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.fallback}>
              <Ionicons name="barcode-outline" size={56} color={COLORS.primary} />
              <Text style={styles.fallbackTitle}>กรอกหรือเลือกบาร์โค้ด</Text>
              <Text style={styles.fallbackHint}>
                หากกล้องใช้ไม่ได้ กรอกบาร์โค้ดด้วยมือหรือเลือกตัวอย่างด้านล่าง
              </Text>
              {!permission?.granted && (
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.textLight} />
                  <Text style={styles.permissionText}>ลองเปิดกล้อง</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.manualSection}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="กรอกบาร์โค้ด"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              onSubmitEditing={() => finishScan(manualCode)}
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => finishScan(manualCode)}
            >
              <Text style={styles.confirmText}>ใช้บาร์โค้ดนี้</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.demoLabel}>บาร์โค้ดตัวอย่าง (คลิกเพื่อใช้)</Text>
          <View style={styles.demoRow}>
            {DEMO_BARCODES.map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.demoChip}
                onPress={() => finishScan(code)}
              >
                <Text style={styles.demoChipText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  cameraWrap: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: '80%',
    height: 120,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  hint: {
    color: COLORS.textLight,
    fontWeight: '600',
    marginTop: 12,
  },
  fallback: {
    alignItems: 'center',
    padding: 20,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fallbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  fallbackHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  manualSection: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  confirmText: {
    color: COLORS.textLight,
    fontWeight: '700',
    fontSize: 13,
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default BarcodeScanModal;
