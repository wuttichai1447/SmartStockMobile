import React from 'react';
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
import CustomButton from './CustomButton';
import { Sale } from '../models/Product';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/helpers';
import { printReceipt } from '../utils/printReceipt';
import { showAlert } from '../utils/alert';

interface ReceiptModalProps {
  visible: boolean;
  sale: Sale | null;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, sale, onClose }) => {
  if (!sale) {
    return null;
  }

  const handlePrint = () => {
    try {
      printReceipt(sale);
    } catch (err) {
      showAlert('พิมพ์ไม่ได้', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={44} color={COLORS.success} />
          </View>
          <Text style={styles.title}>ขายสำเร็จ</Text>
          <Text style={styles.meta}>
            ใบเสร็จ #{sale.id} • {formatDate(sale.createdAt)}
          </Text>

          <ScrollView style={styles.itemsBox} contentContainerStyle={styles.itemsContent}>
            {(sale.items ?? []).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.totalsBox}>
            <Row label="รวม" value={formatCurrency(sale.subtotal)} />
            {sale.discount > 0 && (
              <Row label="ส่วนลด" value={`-${formatCurrency(sale.discount)}`} />
            )}
            <Row label="สุทธิ" value={formatCurrency(sale.total)} bold />
            <Row label="รับเงิน" value={formatCurrency(sale.received)} />
            <Row label="เงินทอน" value={formatCurrency(sale.change)} highlight />
          </View>

          <View style={styles.actions}>
            {Platform.OS === 'web' && (
              <CustomButton
                title="พิมพ์ใบเสร็จ"
                variant="outline"
                onPress={handlePrint}
                icon={<Ionicons name="print-outline" size={18} color={COLORS.primary} />}
                style={styles.flexButton}
              />
            )}
            <CustomButton
              title="เสร็จสิ้น"
              onPress={onClose}
              style={styles.flexButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Row: React.FC<{
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}> = ({ label, value, bold, highlight }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        bold && styles.rowBold,
        highlight && styles.rowHighlight,
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  itemsBox: {
    maxHeight: 220,
  },
  itemsContent: {
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalsBox: {
    marginTop: 14,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  rowBold: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  rowHighlight: {
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  flexButton: {
    flex: 1,
  },
});

export default ReceiptModal;
