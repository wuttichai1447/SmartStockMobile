import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { showAlert } from '../utils/alert';
import BarcodeScanModal from './BarcodeScanModal';

interface BarcodeScanFieldProps {
  value: string;
  onChange: (barcode: string) => void;
  placeholder?: string;
  onDuplicate?: (barcode: string) => boolean;
  showGenerate?: boolean;
  onGenerate?: () => void;
  onScanned?: (barcode: string) => void;
}

const BarcodeScanField: React.FC<BarcodeScanFieldProps> = ({
  value,
  onChange,
  placeholder = 'กรอกหรือสแกนบาร์โค้ด',
  onDuplicate,
  showGenerate = false,
  onGenerate,
  onScanned,
}) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanned = (barcode: string) => {
    if (onDuplicate?.(barcode)) {
      showAlert('บาร์โค้ดซ้ำ', 'มีสินค้าที่ใช้บาร์โค้ดนี้อยู่แล้ว');
      return;
    }
    onChange(barcode);
    onScanned?.(barcode);
  };

  return (
    <View>
      <View style={styles.barcodeRow}>
        <TextInput
          style={[styles.input, showGenerate && styles.inputWithActions]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="scan-outline" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
        {showGenerate && onGenerate && (
          <TouchableOpacity style={styles.generateButton} onPress={onGenerate}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <BarcodeScanModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleScanned}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  input: {
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
  inputWithActions: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BarcodeScanField;
