import React, { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { COLORS, LABELS } from '../utils/constants';
import { formatCurrency, formatDate, formatPriceWithUnit } from '../utils/helpers';
import { showConfirm } from '../utils/alert';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const AlertProductRow: React.FC<{
  product: Product;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle: string;
}> = ({ product, icon, color, subtitle }) => (
  <View style={styles.alertItem}>
    <View style={[styles.alertIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.alertContent}>
      <Text style={styles.alertTitle}>{product.productName}</Text>
      <Text style={styles.alertMeta}>
        {subtitle} • {product.quantity} {product.unit}
      </Text>
    </View>
    <Text style={styles.alertPrice}>
      {formatPriceWithUnit(product.price, product.unit)}
    </Text>
  </View>
);

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    dashboardStats,
    recentActivities,
    lowStockProducts,
    expiringProducts,
    refreshData,
    logout,
    isLoading,
  } = useProducts();
  const [refreshing, setRefreshing] = React.useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            showConfirm(
              LABELS.logout,
              'ต้องการออกจากระบบใช่หรือไม่?',
              logout,
              { confirmText: LABELS.logout, destructive: true }
            )
          }
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.textLight} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{LABELS.dashboard}</Text>
        <Text style={styles.headerSubtitle}>
          {LABELS.marketName} — ภาพรวมสต็อกวันนี้
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="สินค้าทั้งหมด"
          value={dashboardStats.totalProducts}
          icon="cube-outline"
          color={COLORS.primary}
        />
        <StatCard
          title="รับเข้ารวม"
          value={dashboardStats.totalStockIn}
          icon="arrow-down-circle-outline"
          color={COLORS.stockIn}
        />
        <StatCard
          title="จ่ายออกรวม"
          value={dashboardStats.totalStockOut}
          icon="arrow-up-circle-outline"
          color={COLORS.stockOut}
        />
        <StatCard
          title="ยอดขายวันนี้"
          value={formatCurrency(dashboardStats.todaySalesTotal)}
          icon="cart-outline"
          color={COLORS.accent}
        />
        <StatCard
          title="บิลวันนี้"
          value={dashboardStats.todaySalesCount}
          icon="receipt-outline"
          color={COLORS.secondaryDark}
        />
        <StatCard
          title="มูลค่าสต็อก"
          value={formatCurrency(dashboardStats.inventoryValue)}
          icon="cash-outline"
          color={COLORS.secondary}
        />
        <StatCard
          title="สต็อกต่ำ"
          value={dashboardStats.lowStockCount}
          icon="warning-outline"
          color={COLORS.warning}
        />
        <StatCard
          title="ใกล้หมดอายุ"
          value={dashboardStats.expiringSoonCount}
          icon="timer-outline"
          color={COLORS.expiry}
        />
      </View>

      {lowStockProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>แจ้งเตือนสต็อกต่ำ</Text>
            <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
          </View>
          {lowStockProducts.map((product) => (
            <AlertProductRow
              key={product.id}
              product={product}
              icon="alert-circle-outline"
              color={COLORS.warning}
              subtitle={`ต่ำกว่า ${product.minStock} ${product.unit}`}
            />
          ))}
        </View>
      )}

      {expiringProducts.length > 0 && (
        <View style={[styles.section, styles.sectionSpaced]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ใกล้หมดอายุ (3 วัน)</Text>
            <Ionicons name="timer-outline" size={20} color={COLORS.expiry} />
          </View>
          {expiringProducts.map((product) => (
            <AlertProductRow
              key={product.id}
              product={product}
              icon="calendar-outline"
              color={COLORS.expiry}
              subtitle={`หมดอายุ ${product.expiryDate}`}
            />
          ))}
        </View>
      )}

      <View style={[styles.section, styles.sectionSpaced]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>กิจกรรมล่าสุด</Text>
          <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        ) : recentActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>ยังไม่มีกิจกรรม</Text>
          </View>
        ) : (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  {
                    backgroundColor:
                      activity.type === 'IN'
                        ? COLORS.stockIn + '15'
                        : COLORS.stockOut + '15',
                  },
                ]}
              >
                <Ionicons
                  name={activity.type === 'IN' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={activity.type === 'IN' ? COLORS.stockIn : COLORS.stockOut}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.productName}</Text>
                <Text style={styles.activityMeta}>
                  {activity.type === 'IN' ? LABELS.stockIn : LABELS.stockOut} •{' '}
                  {activity.quantity} หน่วย
                </Text>
              </View>
              <Text style={styles.activityDate}>{formatDate(activity.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  logoutButton: {
    marginRight: 12,
    padding: 4,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionSpaced: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  loader: {
    paddingVertical: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    maxWidth: 90,
    textAlign: 'right',
  },
});

export default DashboardScreen;
