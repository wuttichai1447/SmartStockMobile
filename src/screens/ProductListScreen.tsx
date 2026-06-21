import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import CustomButton from '../components/CustomButton';
import { useProducts } from '../context/ProductContext';
import { Product } from '../models/Product';
import { ProductsStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { formatDateShort } from '../utils/helpers';

type NavigationProp = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;

const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { products, loadProducts, deleteProduct, isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts(searchQuery);
    }, [loadProducts, searchQuery])
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadProducts(text);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={handleSearch} />
      </View>

      {isLoading && products.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={handleProductPress}
              onEdit={(product) =>
                navigation.navigate('EditProduct', { productId: product.id })
              }
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Add a new product or adjust your search
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal visible={showDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProduct.productName}</Text>
                  <TouchableOpacity onPress={() => setShowDetails(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailGrid}>
                  <DetailRow label="Product ID" value={`#${selectedProduct.id}`} />
                  <DetailRow label="Category" value={selectedProduct.category} />
                  <DetailRow
                    label="Quantity"
                    value={`${selectedProduct.quantity} ${selectedProduct.unit}`}
                  />
                  <DetailRow label="Barcode" value={selectedProduct.barcode} />
                  <DetailRow
                    label="Created"
                    value={formatDateShort(selectedProduct.createdAt)}
                  />
                </View>

                <CustomButton
                  title="Edit Product"
                  onPress={() => {
                    setShowDetails(false);
                    navigation.navigate('EditProduct', {
                      productId: selectedProduct.id,
                    });
                  }}
                  style={styles.modalButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  detailGrid: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 8,
  },
});

export default ProductListScreen;
