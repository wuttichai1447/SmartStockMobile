import React, { useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

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

  const handleScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned) return;
      const code = data.trim();
      if (!code) return;

      setScanned(true);
      onScanned(code);
      onClose();
    },
    [onClose, onScanned, scanned]
  );

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  const handleOpen = () => {
    setScanned(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      onShow={handleOpen}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.centered}>
            <Text style={styles.message}>กำลังขอสิทธิ์กล้อง...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.message}>ต้องอนุญาตกล้องเพื่อสแกนบาร์โค้ด</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionText}>อนุญาตกล้อง</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scannerArea}>
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
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.hint}>วางบาร์โค้ดในกรอบ</Text>
              {scanned && (
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanText}>สแกนอีกครั้ง</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.primaryDark,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  closeButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: COLORS.background,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionText: {
    color: COLORS.textLight,
    fontWeight: '700',
    fontSize: 15,
  },
  scannerArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scanFrame: {
    width: 280,
    height: 160,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    borderRadius: 16,
  },
  hint: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  rescanButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  rescanText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
});

export default BarcodeScanModal;
