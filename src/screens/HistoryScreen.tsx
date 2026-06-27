import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DatePickerField from '../components/DatePickerField';
import { useProducts } from '../context/ProductContext';
import { Transaction } from '../models/Product';
import { COLORS, LABELS } from '../utils/constants';
import { exportTransactionsToCsv } from '../utils/exportCsv';
import { formatDate } from '../utils/helpers';
import { showAlert } from '../utils/alert';

const HistoryScreen: React.FC = () => {
  const { products, transactions, filterTransactions, isLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  const applyFilters = useCallback(async () => {
    const result = await filterTransactions({
      productId: selectedProductId,
      date: filterDate.trim() || null,
    });
    setFilteredTransactions(result);
  }, [filterTransactions, selectedProductId, filterDate]);

  useFocusEffect(
    useCallback(() => {
      applyFilters();
    }, [applyFilters])
  );

  const clearFilters = async () => {
    setSelectedProductId(null);
    setFilterDate('');
    const result = await filterTransactions({});
    setFilteredTransactions(result);
  };

  const handleExport = () => {
    try {
      exportTransactionsToCsv(displayTransactions);
      showAlert('สำเร็จ', 'ส่งออกไฟล์ CSV แล้ว');
    } catch (err) {
      showAlert(
        'ไม่สามารถส่งออกได้',
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      );
    }
  };

  const displayTransactions =
    filteredTransactions.length > 0 || selectedProductId || filterDate
      ? filteredTransactions
      : transactions;

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>ตัวกรอง</Text>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={18} color={COLORS.primary} />
              <Text style={styles.exportText}>{LABELS.exportCsv}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.filterLabel}>กรองตามวันที่</Text>
        <DatePickerField value={filterDate} onChange={setFilterDate} />

        <Text style={styles.filterLabel}>กรองตามสินค้า</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productFilterRow}
        >
          <FilterChip
            label="สินค้าทั้งหมด"
            selected={selectedProductId === null}
            onPress={() => setSelectedProductId(null)}
          />
          {products.map((product) => (
            <FilterChip
              key={product.id}
              label={product.productName}
              selected={selectedProductId === product.id}
              onPress={() => setSelectedProductId(product.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Ionicons name="filter" size={18} color={COLORS.textLight} />
            <Text style={styles.applyText}>ใช้ตัวกรอง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearText}>ล้าง</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={displayTransactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>ไม่พบประวัติ</Text>
              <Text style={styles.emptySubtitle}>
                การรับเข้า/จ่ายออกจะแสดงที่นี่
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => (
  <View style={styles.transactionCard}>
    <View
      style={[
        styles.typeBadge,
        {
          backgroundColor:
            transaction.type === 'IN'
              ? COLORS.stockIn + '15'
              : COLORS.stockOut + '15',
        },
      ]}
    >
      <Ionicons
        name={transaction.type === 'IN' ? 'arrow-down' : 'arrow-up'}
        size={20}
        color={transaction.type === 'IN' ? COLORS.stockIn : COLORS.stockOut}
      />
    </View>
    <View style={styles.transactionContent}>
      <Text style={styles.transactionTitle}>{transaction.productName}</Text>
      <Text style={styles.transactionMeta}>
        {transaction.type === 'IN' ? LABELS.stockIn : LABELS.stockOut} • {transaction.quantity}{' '}
        หน่วย
      </Text>
      <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterSection: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },
  exportText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  dateInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productFilterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 160,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.textLight,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  applyText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  transactionMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default HistoryScreen;
