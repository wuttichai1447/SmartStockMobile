import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../models/Product';
import { COLORS, LABELS } from '../utils/constants';
import {
  formatCurrency,
  formatDateShort,
  getExpiryLabel,
  isExpired,
  isExpiringSoon,
  isLowStock,
} from '../utils/helpers';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
}) => {
  const lowStock = isLowStock(product);
  const expiring = isExpiringSoon(product);
  const expired = isExpired(product);
  const expiryLabel = getExpiryLabel(product.expiryDate);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onPress(product)} activeOpacity={0.85}>
        <View style={styles.header}>
          <ProductImage
            imageUri={product.imageUri}
            category={product.category}
            size={72}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {product.productName}
            </Text>
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.price}>{formatCurrency(product.price)}/{product.unit}</Text>
          </View>
          <View style={[styles.quantityBadge, lowStock && styles.lowStockBadge]}>
            <Text style={[styles.quantityText, lowStock && styles.lowStockText]}>
              {product.quantity} {product.unit}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          {lowStock && (
            <View style={[styles.badge, styles.warningBadge]}>
              <Ionicons name="warning-outline" size={12} color={COLORS.warning} />
              <Text style={styles.warningText}>สต็อกต่ำ</Text>
            </View>
          )}
          {expiryLabel && (
            <View
              style={[
                styles.badge,
                expired ? styles.errorBadge : expiring ? styles.expiryBadge : styles.neutralBadge,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color={expired ? COLORS.error : expiring ? COLORS.expiry : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.badgeText,
                  expired && styles.errorText,
                  expiring && styles.expiryText,
                ]}
              >
                {expiryLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{product.barcode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{formatDateShort(product.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(product)}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editText}>{LABELS.editProduct}</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(product)}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={styles.deleteText}>{LABELS.delete}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  quantityBadge: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lowStockText: {
    color: COLORS.warning,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningBadge: {
    backgroundColor: COLORS.warning + '15',
  },
  expiryBadge: {
    backgroundColor: COLORS.expiry + '15',
  },
  errorBadge: {
    backgroundColor: COLORS.error + '15',
  },
  neutralBadge: {
    backgroundColor: COLORS.background,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  expiryText: {
    color: COLORS.expiry,
  },
  errorText: {
    color: COLORS.error,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.primary + '10',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '10',
  },
  editText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProductCard;
