import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartScreen } from './src/screens/CartScreen';
import { StoresScreen } from './src/screens/StoresScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import type { MobileProduct, CartItem, TabType, ProductColor, MobileOrder, UserProfile } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [catalogInitialCategory, setCatalogInitialCategory] = useState<string | undefined>(undefined);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-almaty-001');
  const [locale, setLocale] = useState<'ru' | 'kz'>('ru');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Достияр',
    phone: '+7 (701) 992-84-12',
    bonusPoints: 3500,
  });

  const handleToggleLocale = () => {
    setLocale(prev => (prev === 'ru' ? 'kz' : 'ru'));
  };

  const handleAddToCart = (product: MobileProduct, size: string, color: ProductColor) => {
    setCart(prev => {
      const idx = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color.id === color.id
      );
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx]!, quantity: next[idx]!.quantity + 1 };
        return next;
      }
      return [...prev, { product, size, color, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, size: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size)));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderCreated = (order: MobileOrder) => {
    setOrders(prev => [order, ...prev]);
    // Award 5% loyalty points
    const earnedPoints = Math.round(order.totalKzt * 0.05);
    setUserProfile(prev => ({
      ...prev,
      bonusPoints: prev.bonusPoints + earnedPoints,
    }));
  };

  const navigateToCatalogWithCategory = (cat?: string) => {
    setSelectedProduct(null);
    setCatalogInitialCategory(cat);
    setActiveTab('catalog');
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

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
        ) : activeTab === 'home' ? (
          <HomeScreen
            onSelectProduct={setSelectedProduct}
            onNavigateToCatalog={navigateToCatalogWithCategory}
            onNavigateToStores={() => setActiveTab('stores')}
            selectedStoreId={selectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
          />
        ) : activeTab === 'catalog' ? (
          <CatalogScreen
            onSelectProduct={setSelectedProduct}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
            initialCategory={catalogInitialCategory}
          />
        ) : activeTab === 'stores' ? (
          <StoresScreen
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
          />
        ) : activeTab === 'cart' ? (
          <CartScreen
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOrderCreated={handleOrderCreated}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
            onNavigateToCatalog={() => setActiveTab('catalog')}
            userProfile={userProfile}
          />
        ) : (
          <ProfileScreen
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            orders={orders}
            locale={locale}
            onToggleLocale={handleToggleLocale}
            onNavigateToCatalog={() => setActiveTab('catalog')}
          />
        )}
      </View>

      {/* Bottom 5-Tab Navigation Bar */}
      {!selectedProduct && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setActiveTab('home');
            }}
          >
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabIconActive]}>🏠</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Басты' : 'Главная'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setCatalogInitialCategory(undefined);
              setActiveTab('catalog');
            }}
          >
            <Text style={[styles.tabIcon, activeTab === 'catalog' && styles.tabIconActive]}>🛍️</Text>
            <Text style={[styles.tabLabel, activeTab === 'catalog' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Каталог' : 'Каталог'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setActiveTab('stores');
            }}
          >
            <Text style={[styles.tabIcon, activeTab === 'stores' && styles.tabIconActive]}>📍</Text>
            <Text style={[styles.tabLabel, activeTab === 'stores' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Дүкендер' : 'Магазины'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setActiveTab('cart');
            }}
          >
            <View style={styles.tabCartIconWrapper}>
              <Text style={[styles.tabIcon, activeTab === 'cart' && styles.tabIconActive]}>🛒</Text>
              {totalCartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'cart' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Себет' : 'Корзина'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setActiveTab('profile');
            }}
          >
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>👤</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Кабинет' : 'Профиль'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#78350f',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  tabIconActive: {
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  tabCartIconWrapper: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#dc2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
