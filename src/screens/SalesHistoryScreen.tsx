import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DatePickerField from '../components/DatePickerField';
import ReceiptModal from '../components/ReceiptModal';
import { useProducts } from '../context/ProductContext';
import { Sale } from '../models/Product';
import { COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/helpers';

const SalesHistoryScreen: React.FC = () => {
  const { getSales } = useProducts();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [selected, setSelected] = useState<Sale | null>(null);

  const load = useCallback(() => {
    setSales(getSales(filterDate.trim() || null));
  }, [getSales, filterDate]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const dayTotal = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>กรองตามวันที่</Text>
        <DatePickerField value={filterDate} onChange={setFilterDate} />
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {sales.length} บิล
          </Text>
          <Text style={styles.summaryTotal}>{formatCurrency(dayTotal)}</Text>
        </View>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.saleCard}
            onPress={() => setSelected(item)}
            activeOpacity={0.7}
          >
            <View style={styles.saleIcon}>
              <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.saleInfo}>
              <Text style={styles.saleTitle}>บิล #{item.id}</Text>
              <Text style={styles.saleMeta}>
                {item.itemCount} ชิ้น • {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.saleTotal}>{formatCurrency(item.total)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>ยังไม่มีการขาย</Text>
            <Text style={styles.emptySubtitle}>บิลที่ขายจะแสดงที่นี่</Text>
          </View>
        }
      />

      <ReceiptModal
        visible={selected !== null}
        sale={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
};

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
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  saleMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
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

export default SalesHistoryScreen;
