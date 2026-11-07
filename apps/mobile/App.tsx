import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartScreen } from './src/screens/CartScreen';
import { StoresScreen } from './src/screens/StoresScreen';
import type { MobileProduct, CartItem, TabType } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-almaty-001');
  const [locale, setLocale] = useState<'ru' | 'kz'>('ru');
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleToggleLocale = () => {
    setLocale(prev => (prev === 'ru' ? 'kz' : 'ru'));
  };

  const handleAddToCart = (product: MobileProduct, size: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === size);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#78350f" />

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            selectedStoreId={selectedStoreId}
            locale={locale}
          />
        ) : activeTab === 'catalog' ? (
          <CatalogScreen
            onSelectProduct={setSelectedProduct}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
          />
        ) : activeTab === 'cart' ? (
          <CartScreen
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={handleClearCart}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
          />
        ) : (
          <StoresScreen
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
          />
        )}
      </View>

      {/* Bottom Navigation Tabs */}
      {!selectedProduct && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'catalog' && styles.tabItemActive]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text style={styles.tabIcon}>👕</Text>
            <Text style={[styles.tabLabel, activeTab === 'catalog' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Каталог' : 'Каталог'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'stores' && styles.tabItemActive]}
            onPress={() => setActiveTab('stores')}
          >
            <Text style={styles.tabIcon}>📍</Text>
            <Text style={[styles.tabLabel, activeTab === 'stores' && styles.tabLabelActive]}>
              {locale === 'kz' ? '16 Дүкен' : '16 Магазинов'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'cart' && styles.tabItemActive]}
            onPress={() => setActiveTab('cart')}
          >
            <View>
              <Text style={styles.tabIcon}>🛍️</Text>
              {totalCartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalCartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'cart' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Себет' : 'Корзина'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  screenContainer: { flex: 1 },
  tabBar: {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {},
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  tabLabelActive: { color: '#b45309', fontWeight: '800' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
});

