import React from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductListScreen from '../screens/ProductListScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PosScreen from '../screens/PosScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import { COLORS, LABELS } from '../utils/constants';

export type ProductsStackParamList = {
  ProductList: undefined;
  AddProduct: { barcode?: string } | undefined;
  EditProduct: { productId: number };
};

export type PosStackParamList = {
  Pos: undefined;
  SalesHistory: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: NavigatorScreenParams<ProductsStackParamList> | undefined;
  Sell: NavigatorScreenParams<PosStackParamList> | undefined;
  Scanner: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const ProductsStack = createNativeStackNavigator<ProductsStackParamList>();
const PosStack = createNativeStackNavigator<PosStackParamList>();

const PosNavigator = () => (
  <PosStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textLight,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <PosStack.Screen
      name="Pos"
      component={PosScreen}
      options={{ title: LABELS.pos }}
    />
    <PosStack.Screen
      name="SalesHistory"
      component={SalesHistoryScreen}
      options={{ title: LABELS.salesHistory }}
    />
  </PosStack.Navigator>
);

const ProductsNavigator = () => (
  <ProductsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textLight,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: COLORS.background },
    }}
  >
    <ProductsStack.Screen
      name="ProductList"
      component={ProductListScreen}
      options={{ title: LABELS.products }}
    />
    <ProductsStack.Screen
      name="AddProduct"
      component={AddProductScreen}
      options={{ title: LABELS.addProduct }}
    />
    <ProductsStack.Screen
      name="EditProduct"
      component={EditProductScreen}
      options={{ title: LABELS.editProduct }}
    />
  </ProductsStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.textLight,
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        paddingBottom: 4,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
      tabBarIcon: ({ color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';

        switch (route.name) {
          case 'Dashboard':
            iconName = 'grid-outline';
            break;
          case 'Products':
            iconName = 'cube-outline';
            break;
          case 'Sell':
            iconName = 'cart-outline';
            break;
          case 'Scanner':
            iconName = 'scan-outline';
            break;
          case 'History':
            iconName = 'time-outline';
            break;
          case 'Settings':
            iconName = 'settings-outline';
            break;
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: LABELS.dashboard }}
    />
    <Tab.Screen
      name="Products"
      component={ProductsNavigator}
      options={{ headerShown: false, title: LABELS.products }}
    />
    <Tab.Screen
      name="Sell"
      component={PosNavigator}
      options={{ headerShown: false, title: LABELS.sell }}
    />
    <Tab.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{ title: LABELS.scanner }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ title: LABELS.history }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: LABELS.settings }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized } = useProducts();

  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default AppNavigator;
