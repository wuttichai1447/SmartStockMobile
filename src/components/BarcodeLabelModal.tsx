import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatPriceWithUnit } from '../utils/helpers';
import { createBarcodeSvg, printBarcodeLabel } from '../utils/printBarcode';
import { showAlert } from '../utils/alert';
import CustomButton from './CustomButton';

export interface BarcodeLabelPreview {
  productName: string;
  barcode: string;
  price?: number;
  unit?: string;
}

interface BarcodeLabelModalProps {
  visible: boolean;
  label: BarcodeLabelPreview | null;
  onClose: () => void;
}

const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  visible,
  label,
  onClose,
}) => {
  const [svgHtml, setSvgHtml] = useState('');

  useEffect(() => {
    if (!visible || !label || Platform.OS !== 'web') {
      setSvgHtml('');
      return;
    }

    try {
      setSvgHtml(createBarcodeSvg(label.barcode));
    } catch {
      setSvgHtml('');
    }
  }, [label, visible]);

  const priceText = useMemo(() => {
    if (!label || label.price === undefined || !label.unit) return null;
    return formatPriceWithUnit(label.price, label.unit);
  }, [label]);

  const handlePrint = () => {
    if (!label) return;

    try {
      printBarcodeLabel({
        productName: label.productName,
        barcode: label.barcode,
        price: label.price,
        unit: label.unit,
      });
    } catch (err) {
      showAlert(
        'พิมพ์ไม่สำเร็จ',
        err instanceof Error ? err.message : 'ไม่สามารถพิมพ์บาร์โค้ดได้'
      );
    }
  };

  if (!label) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>บาร์โค้ดสินค้า</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.labelCard}>
              <Text style={styles.market}>ตลาด</Text>
              <Text style={styles.productName}>{label.productName}</Text>
              {priceText && <Text style={styles.price}>{priceText}</Text>}

              {Platform.OS === 'web' && svgHtml ? (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '8px 0',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              ) : (
                <View style={styles.barcodeFallback}>
                  <Ionicons name="barcode-outline" size={48} color={COLORS.primary} />
                  <Text style={styles.barcodeCode}>{label.barcode}</Text>
                </View>
              )}

              <Text style={styles.barcodeText}>{label.barcode}</Text>
            </View>

            <Text style={styles.hint}>
              สร้างบาร์โค้ดแล้ว — พิมพ์ติดที่สินค้าได้ (ขนาดสติกเกอร์ประมาณ 7×4 ซม.)
            </Text>

            {Platform.OS === 'web' ? (
              <CustomButton title="พิมพ์บาร์โค้ด" onPress={handlePrint} />
            ) : (
              <Text style={styles.mobileNote}>
                ใช้บาร์โค้ดด้านบนติดที่สินค้า หรือพิมพ์ผ่านเวอร์ชัน Web
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  labelCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: COLORS.background,
  },
  market: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
  },
  barcodeWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  barcodeFallback: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  barcodeCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.text,
  },
  barcodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.text,
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  mobileNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default BarcodeLabelModal;
