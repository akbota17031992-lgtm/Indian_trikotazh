import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartScreen } from './src/screens/CartScreen';
import { StoresScreen } from './src/screens/StoresScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { KaspiAuthModal } from './src/components/KaspiAuthModal';
import { KaspiLockScreen } from './src/components/KaspiLockScreen';
import type { MobileProduct, CartItem, TabType, ProductColor, MobileOrder, UserProfile } from './src/types';

function MainScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [catalogInitialCategory, setCatalogInitialCategory] = useState<string | undefined>(undefined);
  const [catalogInitialSearch, setCatalogInitialSearch] = useState<string | undefined>(undefined);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store-almaty-001');
  const [locale, setLocale] = useState<'ru' | 'kz'>('ru');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([
    'prod-002',
    'prod-003',
  ]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Достияр Алиев',
    phone: '+7 (701) 992-84-12',
    email: 'dostiyar@gmail.com',
    bonusPoints: 3500,
    isRegistered: true,
    pinCode: '1234',
    patternCode: '0-1-2-5-8',
    biometricsEnabled: true,
    preferredUnlockMode: 'pin',
  });
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  if (isLocked) {
    return (
      <KaspiLockScreen
        userProfile={userProfile}
        onUnlock={() => setIsLocked(false)}
        onSwitchAccount={() => {
          setIsLocked(false);
          setIsAuthModalVisible(true);
        }}
        locale={locale}
      />
    );
  }

  const handleSelectProduct = (product: MobileProduct) => {
    setRecentlyViewedIds(prev => [product.id, ...prev.filter(id => id !== product.id)].slice(0, 10));
    setSelectedProduct(product);
  };

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

  const handleRemoveMultipleItems = (
    itemsToRemove: { productId: string; size: string; colorId?: string }[]
  ) => {
    setCart(prev =>
      prev.filter(
        cartItem =>
          !itemsToRemove.some(
            r =>
              r.productId === cartItem.product.id &&
              r.size === cartItem.size &&
              (!r.colorId || r.colorId === cartItem.color.id)
          )
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderCreated = (order: MobileOrder) => {
    setOrders(prev => [order, ...prev]);
    const earnedPoints = Math.round(order.totalKzt * 0.05);
    setUserProfile(prev => ({
      ...prev,
      bonusPoints: prev.bonusPoints + earnedPoints,
    }));
    // Remove only the items that were ordered from the cart
    setCart(prev =>
      prev.filter(
        cartItem =>
          !order.items.some(
            orderedItem =>
              orderedItem.product.id === cartItem.product.id &&
              orderedItem.size === cartItem.size &&
              orderedItem.color.id === cartItem.color.id
          )
      )
    );
  };

  const cartProductQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.product.id] = (map[item.product.id] || 0) + item.quantity;
    }
    return map;
  }, [cart]);

  const handleIncreaseQuantity = (product: MobileProduct) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx]!, quantity: next[idx]!.quantity + 1 };
        return next;
      }
      const defaultSize = product.sizes[0] || 'M';
      const defaultColor = product.colors[0] || {
        id: 'default',
        nameRu: 'Основной',
        nameKz: 'Негізгі',
        hex: '#78350f',
      };
      return [...prev, { product, size: defaultSize, color: defaultColor, quantity: 1 }];
    });
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prev => {
      const idx = prev.map(item => item.product.id).lastIndexOf(productId);
      if (idx === -1) return prev;
      const item = prev[idx]!;
      if (item.quantity > 1) {
        const next = [...prev];
        next[idx] = { ...item, quantity: item.quantity - 1 };
        return next;
      } else {
        return prev.filter((_, i) => i !== idx);
      }
    });
  };

  const navigateToCatalog = (cat?: string, search?: string) => {
    setSelectedProduct(null);
    setCatalogInitialCategory(cat);
    setCatalogInitialSearch(search);
    setActiveTab('catalog');
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            quantityInCart={cartProductQuantities[selectedProduct.id] || 0}
            selectedStoreId={selectedStoreId}
            locale={locale}
          />
        ) : activeTab === 'home' ? (
          <HomeScreen
            onSelectProduct={handleSelectProduct}
            cartProductQuantities={cartProductQuantities}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onNavigateToCatalog={navigateToCatalog}
            onNavigateToStores={() => setActiveTab('stores')}
            onNavigateToProfile={() => setActiveTab('profile')}
            selectedStoreId={selectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
            recentlyViewedIds={recentlyViewedIds}
          />
        ) : activeTab === 'catalog' ? (
          <CatalogScreen
            onSelectProduct={handleSelectProduct}
            cartProductQuantities={cartProductQuantities}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            locale={locale}
            onToggleLocale={handleToggleLocale}
            initialCategory={catalogInitialCategory}
            initialSearchQuery={catalogInitialSearch}
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
            onRemoveMultipleItems={handleRemoveMultipleItems}
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
            onLockApp={() => setIsLocked(true)}
            onOpenAuthModal={() => setIsAuthModalVisible(true)}
            onLogout={() => {
              setUserProfile(prev => ({
                ...prev,
                isRegistered: false,
              }));
              setIsAuthModalVisible(true);
            }}
          />
        )}
      </View>

      {/* Kaspi Auth & Registration Modal */}
      <KaspiAuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
        onSuccess={newProfile => {
          setUserProfile(newProfile);
          setIsAuthModalVisible(false);
          setIsLocked(false);
        }}
        locale={locale}
      />

      {/* Bottom 5-Tab Navigation Bar with Native Ionicons */}
      {!selectedProduct && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setSelectedProduct(null);
              setActiveTab('home');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'home' ? '#b45309' : '#64748b'}
            />
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
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'catalog' ? 'grid' : 'grid-outline'}
              size={22}
              color={activeTab === 'catalog' ? '#b45309' : '#64748b'}
            />
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
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'stores' ? 'location' : 'location-outline'}
              size={22}
              color={activeTab === 'stores' ? '#b45309' : '#64748b'}
            />
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
            activeOpacity={0.7}
          >
            <View style={styles.tabCartIconWrapper}>
              <Ionicons
                name={activeTab === 'cart' ? 'cart' : 'cart-outline'}
                size={22}
                color={activeTab === 'cart' ? '#b45309' : '#64748b'}
              />
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
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeTab === 'profile' ? '#b45309' : '#64748b'}
            />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              {locale === 'kz' ? 'Кабинет' : 'Профиль'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#78350f',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 3,
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
    top: -5,
    right: -10,
    backgroundColor: '#dc2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
