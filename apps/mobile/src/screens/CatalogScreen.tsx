import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import { MOBILE_PRODUCTS } from '../data/mock-products';
import type { MobileProduct } from '../types';

interface Props {
  onSelectProduct: (product: MobileProduct) => void;
  cartProductQuantities: Record<string, number>;
  onIncreaseQuantity: (product: MobileProduct) => void;
  onDecreaseQuantity: (productId: string) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
  initialCategory?: string;
  initialSearchQuery?: string;
}

export type SortType = 'popular' | 'price_asc' | 'price_desc' | 'discount';

const COLOR_OPTIONS = [
  { id: 'white', nameRu: 'Белый', nameKz: 'Ақ', hex: '#ffffff', border: true },
  { id: 'black', nameRu: 'Черный', nameKz: 'Қара', hex: '#111827' },
  { id: 'navy', nameRu: 'Темно-синий', nameKz: 'Қою көк', hex: '#1e3a8a' },
  { id: 'olive', nameRu: 'Оливковый', nameKz: 'Зәйтүн', hex: '#3f6212' },
  { id: 'terracotta', nameRu: 'Терракот', nameKz: 'Терракот', hex: '#b45309' },
  { id: 'emerald', nameRu: 'Изумруд', nameKz: 'Зүбаржат', hex: '#047857' },
  { id: 'ruby', nameRu: 'Бордо', nameKz: 'Шие', hex: '#881337' },
  { id: 'sage', nameRu: 'Шалфей', nameKz: 'Шалфей', hex: '#64748b' },
  { id: 'rose', nameRu: 'Пыльная роза', nameKz: 'Қызғылт', hex: '#be185d' },
  { id: 'charcoal', nameRu: 'Графит', nameKz: 'Графит', hex: '#334155' },
  { id: 'grey', nameRu: 'Серый меланж', nameKz: 'Сұр меланж', hex: '#94a3b8' },
  { id: 'cream', nameRu: 'Кремовый', nameKz: 'Крем түсті', hex: '#fef3c7', border: true },
  { id: 'lavender', nameRu: 'Лаванда', nameKz: 'Лаванда', hex: '#a78bfa' },
  { id: 'sand', nameRu: 'Песочный', nameKz: 'Құм түсті', hex: '#d97706' },
  { id: 'anthracite', nameRu: 'Антрацит', nameKz: 'Антрацит', hex: '#262626' },
];

const SIZE_OPTIONS = [
  { id: 'S', label: 'S (42-44)', group: 'adult' },
  { id: 'M', label: 'M (46)', group: 'adult' },
  { id: 'L', label: 'L (48)', group: 'adult' },
  { id: 'XL', label: 'XL (50-52)', group: 'adult' },
  { id: '2XL', label: '2XL (54)', group: 'adult' },
  { id: '3XL', label: '3XL (56)', group: 'adult' },
  { id: '4XL', label: '4XL (58-60)', group: 'adult' },
  { id: 'S/M', label: 'S/M (42-46)', group: 'dual' },
  { id: 'L/XL', label: 'L/XL (48-52)', group: 'dual' },
  { id: '2XL/3XL', label: '2XL/3XL (54-58)', group: 'dual' },
];

const GENDER_OPTIONS = [
  { id: 'all', titleRu: 'Все', titleKz: 'Барлығы' },
  { id: 'women', titleRu: 'Женщинам', titleKz: 'Әйелдерге' },
  { id: 'men', titleRu: 'Мужчинам', titleKz: 'Ерлерге' },
  { id: 'kids', titleRu: 'Детям', titleKz: 'Балаларға' },
  { id: 'home', titleRu: 'Для дома', titleKz: 'Үйге' },
];

const COMPOSITION_OPTIONS = [
  { id: 'all', titleRu: 'Любой состав', titleKz: 'Кез келген' },
  { id: 'cotton100', titleRu: '100% Эко-хлопок', titleKz: '100% Табиғи мақта' },
  { id: 'batiste', titleRu: 'Батист и трикотаж', titleKz: 'Бәтес және трикотаж' },
  { id: 'waffle', titleRu: 'Вафельный хлопок', titleKz: 'Вафли мақта' },
  { id: 'microfleece', titleRu: 'С микроначесом', titleKz: 'Микрожүнмен' },
  { id: 'elastane', titleRu: 'С эластаном', titleKz: 'Эластанмен' },
];

const PRICE_PRESETS = [
  { label: 'До 5 000 ₸', min: '', max: '5000' },
  { label: '5 000 – 10 000 ₸', min: '5000', max: '10000' },
  { label: '10 000 – 15 000 ₸', min: '10000', max: '15000' },
  { label: 'От 15 000 ₸', min: '15000', max: '' },
];

const SORT_OPTIONS: { id: SortType; icon: any; ru: string; kz: string }[] = [
  { id: 'popular', icon: 'flame', ru: 'По популярности', kz: 'Танымалдығы бойынша' },
  { id: 'price_asc', icon: 'trending-down', ru: 'Сначала дешевле', kz: 'Алдымен арзандары' },
  { id: 'price_desc', icon: 'trending-up', ru: 'Сначала дороже', kz: 'Алдымен қымбаттары' },
  { id: 'discount', icon: 'pricetag', ru: 'По скидке', kz: 'Жеңілдік бойынша' },
];

export function CatalogScreen({
  onSelectProduct,
  cartProductQuantities,
  onIncreaseQuantity,
  onDecreaseQuantity,
  selectedStoreId,
  onSelectStore,
  locale,
  onToggleLocale,
  initialCategory,
  initialSearchQuery,
}: Props) {
  // Main filter states
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedComposition, setSelectedComposition] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('popular');

  // Modal and tabs state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sizeTab, setSizeTab] = useState<'all' | 'adult' | 'dual'>('all');

  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const categories = [
    { id: 'all', titleRu: 'Все товары', titleKz: 'Барлығы', icon: '🛍️' },
    { id: 't-shirts', titleRu: 'Футболки', titleKz: 'Футболкалар', icon: '👕' },
    { id: 'tunics', titleRu: 'Туники', titleKz: 'Туникалар', icon: '👗' },
    { id: 'pajamas', titleRu: 'Пижамы', titleKz: 'Пижамалар', icon: '🌙' },
    { id: 'long-sleeves', titleRu: 'Лонгсливы', titleKz: 'Лонгсливтер', icon: '🧥' },
    { id: 'robes', titleRu: 'Халаты', titleKz: 'Шапандар', icon: '👘' },
    { id: 'thermal-underwear', titleRu: 'Термобелье', titleKz: 'Термоішкиім', icon: '❄️' },
  ];

  // Toggle helpers for multi-select
  const toggleSize = (sizeId: string) => {
    setSelectedSizes(prev =>
      prev.includes(sizeId) ? prev.filter(s => s !== sizeId) : [...prev, sizeId]
    );
  };

  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId) ? prev.filter(c => c !== colorId) : [...prev, colorId]
    );
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedComposition('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setInStockOnly(false);
    setDiscountOnly(false);
    setSearchQuery('');
  };

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedGender !== 'all') count++;
    if (selectedComposition !== 'all') count++;
    if (selectedSizes.length > 0) count += selectedSizes.length;
    if (selectedColors.length > 0) count += selectedColors.length;
    if (minPriceInput.trim() || maxPriceInput.trim()) count++;
    if (inStockOnly) count++;
    if (discountOnly) count++;
    return count;
  }, [
    selectedCategory,
    selectedGender,
    selectedComposition,
    selectedSizes,
    selectedColors,
    minPriceInput,
    maxPriceInput,
    inStockOnly,
    discountOnly,
  ]);

  // Filtering logic
  const filteredProducts = useMemo(() => {
    const minP = minPriceInput.trim() ? parseInt(minPriceInput.trim(), 10) : 0;
    const maxP = maxPriceInput.trim() ? parseInt(maxPriceInput.trim(), 10) : Infinity;

    return MOBILE_PRODUCTS.filter(p => {
      // 1. Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (locale === 'kz' ? p.titleKz : p.titleRu).toLowerCase();
        const desc = (locale === 'kz' ? p.descriptionKz : p.descriptionRu).toLowerCase();
        const comp = (locale === 'kz' ? p.compositionKz : p.compositionRu).toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !comp.includes(q)) return false;
      }

      // 3. Gender / "Кому"
      if (selectedGender !== 'all') {
        const text = `${p.titleRu} ${p.titleKz} ${p.descriptionRu} ${p.descriptionKz}`.toLowerCase();
        if (selectedGender === 'women') {
          if (!text.includes('женск') && !text.includes('туник') && !text.includes('әйел') && !text.includes('халат')) {
            return false;
          }
        } else if (selectedGender === 'men') {
          if (!text.includes('мужск') && !text.includes('лонгслив') && !text.includes('кальсон') && !text.includes('базов') && !text.includes('ерлер')) {
            return false;
          }
        } else if (selectedGender === 'kids') {
          if (!text.includes('детск') && !text.includes('бала') && !text.includes('малыш')) {
            return false;
          }
        } else if (selectedGender === 'home') {
          if (p.category !== 'pajamas' && p.category !== 'robes' && !text.includes('дом') && !text.includes('ұйқы')) {
            return false;
          }
        }
      }

      // 4. Sizes
      if (selectedSizes.length > 0) {
        const hasMatch = selectedSizes.some(s => p.sizes.includes(s));
        if (!hasMatch) return false;
      }

      // 5. Colors
      if (selectedColors.length > 0) {
        const productColors = p.colors.map(c => c.id.toLowerCase());
        const hasMatch = selectedColors.some(c => productColors.includes(c.toLowerCase()));
        if (!hasMatch) return false;
      }

      // 6. Composition
      if (selectedComposition !== 'all') {
        const compText = `${p.compositionRu} ${p.compositionKz}`.toLowerCase();
        if (selectedComposition === 'cotton100' && !compText.includes('100%')) return false;
        if (selectedComposition === 'batiste' && !compText.includes('батист') && !compText.includes('бәтес')) return false;
        if (selectedComposition === 'waffle' && !compText.includes('вафель') && !compText.includes('вафли')) return false;
        if (selectedComposition === 'microfleece' && !compText.includes('микронач') && !compText.includes('микрожүн')) return false;
        if (selectedComposition === 'elastane' && !compText.includes('эластан')) return false;
      }

      // 7. Price
      if (!isNaN(minP) && minP > 0 && p.priceKzt < minP) return false;
      if (!isNaN(maxP) && isFinite(maxP) && p.priceKzt > maxP) return false;

      // 8. In Stock in store
      if (inStockOnly) {
        const stockInStore = p.stockByStore[selectedStoreId] ?? 0;
        if (stockInStore <= 0) return false;
      }

      // 9. Discount
      if (discountOnly) {
        if (!p.oldPriceKzt || p.oldPriceKzt <= p.priceKzt) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceKzt - b.priceKzt;
      if (sortBy === 'price_desc') return b.priceKzt - a.priceKzt;
      if (sortBy === 'discount') {
        const discA = a.oldPriceKzt ? a.oldPriceKzt - a.priceKzt : 0;
        const discB = b.oldPriceKzt ? b.oldPriceKzt - b.priceKzt : 0;
        return discB - discA;
      }
      return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
    });
  }, [
    selectedCategory,
    searchQuery,
    locale,
    selectedGender,
    selectedSizes,
    selectedColors,
    selectedComposition,
    minPriceInput,
    maxPriceInput,
    inStockOnly,
    selectedStoreId,
    discountOnly,
    sortBy,
  ]);

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const sortLabels: Record<SortType, { ru: string; kz: string }> = {
    popular: { ru: 'По популярности', kz: 'Танымалдығы бойынша' },
    price_asc: { ru: 'Сначала дешевле', kz: 'Алдымен арзандары' },
    price_desc: { ru: 'Сначала дороже', kz: 'Алдымен қымбаттары' },
    discount: { ru: 'По скидке', kz: 'Жеңілдік бойынша' },
  };

  const displayedSizeOptions = SIZE_OPTIONS.filter(
    s => sizeTab === 'all' || s.group === sizeTab
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>КАТАЛОГ ТОВАРОВ</Text>
          <Text style={styles.brandSubtitle}>
            {locale === 'kz'
              ? `${filteredProducts.length} тауар табылды`
              : `${filteredProducts.length} моделей в наличии`}
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Store Bar */}
      <View style={styles.storeBar}>
        <Ionicons name="location-sharp" size={14} color="#b45309" style={{ marginRight: 6 }} />
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>
            {locale === 'kz' ? 'Филиалдағы қалдықтар:' : 'Наличие в филиале:'}
          </Text>
          <Text style={styles.storeName}>
            {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={
              locale === 'kz' ? 'Тауарларды, матаны іздеу...' : 'Поиск по трикотажу, составу...'
            }
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Horizontal Pills */}
      <View style={{ marginBottom: 4 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: c }) => {
            const isActive = selectedCategory === c.id;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryPillEmoji}>{c.icon}</Text>
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {locale === 'kz' ? c.titleKz : c.titleRu}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Kaspi-Style Filter & Sort Toolbar */}
      <View style={styles.filterToolbar}>
        {/* Main Kaspi "Фильтры" Button */}
        <TouchableOpacity
          style={[styles.mainFilterBtn, activeFiltersCount > 0 && styles.mainFilterBtnActive]}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFiltersCount > 0 ? '#ffffff' : '#0f172a'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.mainFilterBtnText, activeFiltersCount > 0 && styles.mainFilterBtnTextActive]}
          >
            {locale === 'kz' ? 'Сүзгілер' : 'Фильтры'}
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick In-Stock Toggle */}
        <TouchableOpacity
          style={[styles.stockFilterBtn, inStockOnly && styles.stockFilterBtnActive]}
          onPress={() => setInStockOnly(!inStockOnly)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={inStockOnly ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={inStockOnly ? '#059669' : '#64748b'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.stockFilterText, inStockOnly && styles.stockFilterTextActive]}>
            {locale === 'kz' ? 'Қоймада' : 'В наличии'}
          </Text>
        </TouchableOpacity>

        {/* Sort Dropdown Button */}
        <TouchableOpacity
          style={[styles.sortBtn, isSortDropdownOpen && styles.sortBtnActive]}
          onPress={() => setIsSortDropdownOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical" size={13} color="#475569" style={{ marginRight: 4 }} />
          <Text style={styles.sortBtnText} numberOfLines={1}>
            {locale === 'kz' ? sortLabels[sortBy].kz : sortLabels[sortBy].ru}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color="#64748b"
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips Bar (Quick Dismiss like Kaspi) */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChipsList}>
            {selectedCategory !== 'all' && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>
                  {categories.find(c => c.id === selectedCategory)?.titleRu || selectedCategory}
                </Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {selectedGender !== 'all' && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => setSelectedGender('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>
                  {GENDER_OPTIONS.find(g => g.id === selectedGender)?.titleRu || selectedGender}
                </Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {(minPriceInput.trim() || maxPriceInput.trim()) && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => {
                  setMinPriceInput('');
                  setMaxPriceInput('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>
                  {minPriceInput ? `от ${minPriceInput} ₸` : ''} {maxPriceInput ? `до ${maxPriceInput} ₸` : ''}
                </Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {selectedSizes.map(sizeId => (
              <TouchableOpacity
                key={`chip-size-${sizeId}`}
                style={styles.activeChip}
                onPress={() => toggleSize(sizeId)}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>Размер: {sizeId}</Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}

            {selectedColors.map(colorId => {
              const colorObj = COLOR_OPTIONS.find(c => c.id === colorId);
              return (
                <TouchableOpacity
                  key={`chip-color-${colorId}`}
                  style={styles.activeChip}
                  onPress={() => toggleColor(colorId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.activeChipColorDot,
                      { backgroundColor: colorObj?.hex || '#000' },
                      colorObj?.border && styles.colorDotBorder,
                    ]}
                  />
                  <Text style={styles.activeChipText}>{colorObj?.nameRu || colorId}</Text>
                  <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}

            {selectedComposition !== 'all' && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => setSelectedComposition('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>
                  {COMPOSITION_OPTIONS.find(c => c.id === selectedComposition)?.titleRu}
                </Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            {discountOnly && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => setDiscountOnly(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.activeChipText}>🔥 Со скидкой</Text>
                <Ionicons name="close" size={12} color="#b45309" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={handleResetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllChipText}>
                {locale === 'kz' ? 'Тазарту' : 'Сбросить все'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {locale === 'kz' ? 'Тауарлар табылмады' : 'Ничего не найдено'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {locale === 'kz'
                ? 'Сүзгілерді өзгертіп көріңіз'
                : 'Попробуйте изменить параметры или сбросить фильтры'}
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={handleResetFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.resetFilterText}>
                {locale === 'kz' ? 'Сүзгілерді тазарту' : 'Сбросить все фильтры'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const stock = item.stockByStore[selectedStoreId] ?? 0;
          const quantityInCart = cartProductQuantities[item.id] || 0;
          return (
            <View style={[styles.card, quantityInCart > 0 && styles.cardInCart]}>
              <TouchableOpacity onPress={() => onSelectProduct(item)} activeOpacity={0.88}>
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

                  {/* Discount Badge */}
                  {item.oldPriceKzt && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        -{Math.round(((item.oldPriceKzt - item.priceKzt) / item.oldPriceKzt) * 100)}%
                      </Text>
                    </View>
                  )}

                  {/* Permanent In-Cart Badge Marker */}
                  {quantityInCart > 0 && (
                    <View style={styles.inCartBadge}>
                      <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
                      <Text style={styles.inCartBadgeText}>
                        {quantityInCart} {locale === 'kz' ? 'себетте' : 'в корзине'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBodyTop}>
                  <View style={styles.stockBadgeRow}>
                    <View
                      style={[styles.stockDot, { backgroundColor: stock > 0 ? '#10b981' : '#f59e0b' }]}
                    />
                    <Text style={[styles.stockText, stock === 0 && styles.stockTextZero]}>
                      {stock > 0
                        ? locale === 'kz'
                          ? `Қоймада: ${stock} дана`
                          : `В наличии: ${stock} шт.`
                        : locale === 'kz'
                        ? 'Басқа дүкендерде бар'
                        : 'В других филиалах'}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {locale === 'kz' ? item.titleKz : item.titleRu}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardBodyBottom}>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1, paddingRight: 4 }}>
                    <Text style={styles.cardPrice}>{formatKZT(item.priceKzt)}</Text>
                    {item.oldPriceKzt && (
                      <Text style={styles.cardOldPrice}>{formatKZT(item.oldPriceKzt)}</Text>
                    )}
                  </View>

                  {quantityInCart > 0 ? (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onDecreaseQuantity(item.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="remove" size={13} color="#065f46" />
                      </TouchableOpacity>

                      <View style={styles.stepperCountWrap}>
                        <Text style={styles.stepperCountText}>{quantityInCart}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.stepperBtn, styles.stepperBtnPlus]}
                        onPress={() => onIncreaseQuantity(item)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="add" size={13} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.quickAddBtn}
                      onPress={() => onIncreaseQuantity(item)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="cart" size={15} color="#b45309" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.kaspiRedBadge}>
                  <Text style={styles.kaspiRedText}>
                    Kaspi Red {formatKZT(Math.round(item.priceKzt / 3))} x 3
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Kaspi-Style Full Detailed Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(false)}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.modalHeaderTitle}>
                {locale === 'kz' ? 'Сүзгілер' : 'Фильтры'}
              </Text>
              {activeFiltersCount > 0 && (
                <Text style={styles.modalHeaderSubtitle}>
                  {locale === 'kz' ? `${activeFiltersCount} белсенді` : `Выбрано: ${activeFiltersCount}`}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.modalResetBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalResetText}>
                {locale === 'kz' ? 'Тазарту' : 'Сбросить'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Section 1: Цена (₸) с пресетами Kaspi */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>
                  {locale === 'kz' ? 'Бағасы (₸)' : 'Цена (₸)'}
                </Text>
                {(minPriceInput.trim() || maxPriceInput.trim()) && (
                  <TouchableOpacity
                    onPress={() => {
                      setMinPriceInput('');
                      setMaxPriceInput('');
                    }}
                  >
                    <Text style={styles.filterClearLink}>
                      {locale === 'kz' ? 'Өшіру' : 'Очистить'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.priceInputsRow}>
                <View style={styles.priceInputBox}>
                  <Text style={styles.priceInputPrefix}>от</Text>
                  <TextInput
                    style={styles.priceInputField}
                    keyboardType="numeric"
                    placeholder="1 000"
                    placeholderTextColor="#94a3b8"
                    value={minPriceInput}
                    onChangeText={setMinPriceInput}
                  />
                  <Text style={styles.priceInputSuffix}>₸</Text>
                </View>

                <View style={styles.priceInputsDivider} />

                <View style={styles.priceInputBox}>
                  <Text style={styles.priceInputPrefix}>до</Text>
                  <TextInput
                    style={styles.priceInputField}
                    keyboardType="numeric"
                    placeholder="30 000"
                    placeholderTextColor="#94a3b8"
                    value={maxPriceInput}
                    onChangeText={setMaxPriceInput}
                  />
                  <Text style={styles.priceInputSuffix}>₸</Text>
                </View>
              </View>

              {/* Quick Range Presets */}
              <View style={styles.pricePresetsRow}>
                {PRICE_PRESETS.map((preset, idx) => {
                  const isSelected =
                    minPriceInput === preset.min && maxPriceInput === preset.max;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.pricePresetChip, isSelected && styles.pricePresetChipActive]}
                      onPress={() => {
                        if (isSelected) {
                          setMinPriceInput('');
                          setMaxPriceInput('');
                        } else {
                          setMinPriceInput(preset.min);
                          setMaxPriceInput(preset.max);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pricePresetChipText,
                          isSelected && styles.pricePresetChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Кому (Пол / Назначение) */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {locale === 'kz' ? 'Кімге' : 'Кому'}
              </Text>
              <View style={styles.chipsWrapRow}>
                {GENDER_OPTIONS.map(g => {
                  const isSelected = selectedGender === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => setSelectedGender(g.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipPillText, isSelected && styles.chipPillTextActive]}>
                        {locale === 'kz' ? g.titleKz : g.titleRu}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Категория товара */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {locale === 'kz' ? 'Санат' : 'Категория'}
              </Text>
              <View style={styles.chipsWrapRow}>
                {categories.map(c => {
                  const isSelected = selectedCategory === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => setSelectedCategory(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ marginRight: 4 }}>{c.icon}</Text>
                      <Text style={[styles.chipPillText, isSelected && styles.chipPillTextActive]}>
                        {locale === 'kz' ? c.titleKz : c.titleRu}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Размеры Kaspi-style */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>
                  {locale === 'kz' ? 'Өлшемі' : 'Размер одежды'}
                </Text>
                {selectedSizes.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedSizes([])}>
                    <Text style={styles.filterClearLink}>
                      {locale === 'kz' ? 'Өшіру' : 'Очистить'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Size Tabs */}
              <View style={styles.sizeTabsRow}>
                <TouchableOpacity
                  style={[styles.sizeTabBtn, sizeTab === 'all' && styles.sizeTabBtnActive]}
                  onPress={() => setSizeTab('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeTabText, sizeTab === 'all' && styles.sizeTabTextActive]}>
                    Все
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sizeTabBtn, sizeTab === 'adult' && styles.sizeTabBtnActive]}
                  onPress={() => setSizeTab('adult')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeTabText, sizeTab === 'adult' && styles.sizeTabTextActive]}>
                    Взрослые
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sizeTabBtn, sizeTab === 'dual' && styles.sizeTabBtnActive]}
                  onPress={() => setSizeTab('dual')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeTabText, sizeTab === 'dual' && styles.sizeTabTextActive]}>
                    Сдвоенные
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sizes Grid */}
              <View style={styles.sizesGrid}>
                {displayedSizeOptions.map(s => {
                  const isSelected = selectedSizes.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sizeBox, isSelected && styles.sizeBoxActive]}
                      onPress={() => toggleSize(s.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.sizeBoxTitle, isSelected && styles.sizeBoxTitleActive]}>
                        {s.id}
                      </Text>
                      <Text style={[styles.sizeBoxSub, isSelected && styles.sizeBoxSubActive]}>
                        {s.label.split(' ')[1] || ''}
                      </Text>
                      {isSelected && (
                        <View style={styles.sizeBoxCheck}>
                          <Ionicons name="checkmark" size={10} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 5: Цветовая палитра Kaspi (15 оттенков) */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>
                  {locale === 'kz' ? 'Түсі' : 'Цвет'}
                </Text>
                {selectedColors.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedColors([])}>
                    <Text style={styles.filterClearLink}>
                      {locale === 'kz' ? 'Өшіру' : 'Очистить'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.colorsGrid}>
                {COLOR_OPTIONS.map(c => {
                  const isSelected = selectedColors.includes(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.colorPill, isSelected && styles.colorPillActive]}
                      onPress={() => toggleColor(c.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          c.border && styles.colorDotBorder,
                        ]}
                      />
                      <Text
                        style={[styles.colorPillText, isSelected && styles.colorPillTextActive]}
                        numberOfLines={1}
                      >
                        {locale === 'kz' ? c.nameKz : c.nameRu}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#b45309"
                          style={{ marginLeft: 2 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 6: Ткань и состав */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {locale === 'kz' ? 'Мата құрамы' : 'Состав и ткань'}
              </Text>
              <View style={styles.chipsWrapRow}>
                {COMPOSITION_OPTIONS.map(comp => {
                  const isSelected = selectedComposition === comp.id;
                  return (
                    <TouchableOpacity
                      key={comp.id}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => setSelectedComposition(comp.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipPillText, isSelected && styles.chipPillTextActive]}>
                        {locale === 'kz' ? comp.titleKz : comp.titleRu}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 7: Наличие и спецпредложения (Kaspi Toggles) */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {locale === 'kz' ? 'Қолжетімділік және акциялар' : 'Наличие и акции'}
              </Text>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setInStockOnly(!inStockOnly)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleTextWrap}>
                  <Text style={styles.toggleTitle}>
                    {locale === 'kz' ? 'Дүкенде бар (Бүгін алып кету)' : 'Самовывоз сегодня'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {locale === 'kz'
                      ? `${currentStore.nameKz} филиалында қоймада`
                      : `В наличии в ${currentStore.nameRu}`}
                  </Text>
                </View>
                <Ionicons
                  name={inStockOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={inStockOnly ? '#059669' : '#cbd5e1'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleRow, { borderBottomWidth: 0 }]}
                onPress={() => setDiscountOnly(!discountOnly)}
                activeOpacity={0.8}
              >
                <View style={styles.toggleTextWrap}>
                  <Text style={styles.toggleTitle}>
                    {locale === 'kz' ? 'Жеңілдікпен тауарлар' : 'Только со скидкой'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {locale === 'kz' ? 'Акциялар мен арнайы бағалар' : 'Распродажа и спецпредложения'}
                  </Text>
                </View>
                <Ionicons
                  name={discountOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={discountOnly ? '#dc2626' : '#cbd5e1'}
                />
              </TouchableOpacity>
            </View>

            {/* Section 8: Сортировка */}
            <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
              <Text style={styles.filterSectionTitle}>
                {locale === 'kz' ? 'Сұрыптау' : 'Сортировка'}
              </Text>
              <View style={styles.chipsWrapRow}>
                {(['popular', 'price_asc', 'price_desc', 'discount'] as SortType[]).map(type => {
                  const isSelected = sortBy === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chipPill, isSelected && styles.chipPillActive]}
                      onPress={() => setSortBy(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipPillText, isSelected && styles.chipPillTextActive]}>
                        {locale === 'kz' ? sortLabels[type].kz : sortLabels[type].ru}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Sticky Bottom Kaspi Action Button */}
          <View style={styles.modalStickyFooter}>
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => setIsFilterModalOpen(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.modalApplyBtnText}>
                {locale === 'kz'
                  ? `${filteredProducts.length} тауарды көрсету`
                  : `Показать ${filteredProducts.length} ${
                      filteredProducts.length === 1 ? 'товар' : 'товаров'
                    }`}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Sort Dropdown Modal */}
      <Modal
        visible={isSortDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.sortDropdownBackdrop}
          activeOpacity={1}
          onPress={() => setIsSortDropdownOpen(false)}
        >
          <View style={styles.sortDropdownCard}>
            <View style={styles.sortDropdownHeader}>
              <View style={styles.sortDropdownHeaderLeft}>
                <Ionicons name="swap-vertical" size={15} color="#b45309" style={{ marginRight: 6 }} />
                <Text style={styles.sortDropdownHeaderTitle}>
                  {locale === 'kz' ? 'Сұрыптау тәртібі' : 'Сортировка товаров'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSortDropdownOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortDropdownOptionsList}>
              {SORT_OPTIONS.map((opt, idx) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.sortDropdownOption,
                      idx < SORT_OPTIONS.length - 1 && styles.sortDropdownOptionBorder,
                      isSelected && styles.sortDropdownOptionActive,
                    ]}
                    onPress={() => {
                      setSortBy(opt.id);
                      setIsSortDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.sortOptionIconBox,
                        isSelected && styles.sortOptionIconBoxActive,
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={14}
                        color={isSelected ? '#b45309' : '#64748b'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sortDropdownOptionText,
                        isSelected && styles.sortDropdownOptionTextActive,
                      ]}
                    >
                      {locale === 'kz' ? opt.kz : opt.ru}
                    </Text>
                    <View
                      style={[
                        styles.sortRadioOuter,
                        isSelected && styles.sortRadioOuterActive,
                      ]}
                    >
                      {isSelected && <View style={styles.sortRadioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: { color: '#fef3c7', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  brandSubtitle: { color: '#fde68a', fontSize: 11, marginTop: 1 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  storeBar: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  storeInfo: { flex: 1 },
  storeLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '700' },
  storeName: { fontSize: 12, color: '#451a03', fontWeight: '800' },
  searchContainer: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  categoryList: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  categoryPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  categoryPillEmoji: { fontSize: 13 },
  categoryText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  categoryTextActive: { color: '#ffffff', fontWeight: '700' },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  mainFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  mainFilterBtnActive: {
    backgroundColor: '#b45309',
    borderColor: '#b45309',
  },
  mainFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  mainFilterBtnTextActive: {
    color: '#ffffff',
  },
  filterCountBadge: {
    backgroundColor: '#dc2626',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterCountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  stockFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  stockFilterBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  stockFilterText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  stockFilterTextActive: { color: '#047857', fontWeight: '700' },
  sortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  sortBtnText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  activeChipsWrapper: {
    paddingBottom: 8,
  },
  activeChipsList: {
    paddingHorizontal: 14,
    gap: 6,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  activeChipColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  colorDotBorder: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  clearAllChip: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  clearAllChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  listContent: { paddingHorizontal: 10, paddingBottom: 24 },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInCart: {
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  cardImageContainer: { position: 'relative', width: '100%', height: 165, backgroundColor: '#f1f5f9' },
  cardImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  inCartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  inCartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBodyTop: { paddingHorizontal: 10, paddingTop: 10 },
  cardBodyBottom: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  stockBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { color: '#047857', fontSize: 10, fontWeight: '600' },
  stockTextZero: { color: '#9a3412' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b', minHeight: 32, lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  cardOldPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    overflow: 'hidden',
    height: 28,
  },
  stepperBtn: {
    width: 24,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
  },
  stepperCountWrap: {
    minWidth: 20,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  stepperBtnPlus: {
    backgroundColor: '#059669',
  },
  quickAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaspiRedBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#fee2e2',
  },
  kaspiRedText: { color: '#dc2626', fontSize: 9, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  resetFilterBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '700',
    marginTop: 1,
  },
  modalResetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalResetText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '700',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  filterClearLink: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  priceInputPrefix: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 6,
  },
  priceInputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  priceInputSuffix: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginLeft: 4,
  },
  priceInputsDivider: {
    width: 8,
    height: 1.5,
    backgroundColor: '#cbd5e1',
  },
  pricePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pricePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pricePresetChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  pricePresetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pricePresetChipTextActive: {
    color: '#b45309',
    fontWeight: '700',
  },
  chipsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipPillActive: {
    backgroundColor: '#78350f',
    borderColor: '#78350f',
  },
  chipPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chipPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sizeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  sizeTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  sizeTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sizeTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  sizeTabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeBox: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sizeBoxActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#b45309',
  },
  sizeBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sizeBoxTitleActive: {
    color: '#b45309',
  },
  sizeBoxSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  sizeBoxSubActive: {
    color: '#92400e',
  },
  sizeBoxCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  colorPillActive: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  colorPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  colorPillTextActive: {
    color: '#78350f',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalStickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  modalApplyBtn: {
    backgroundColor: '#b45309',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  modalApplyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  sortBtnActive: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  sortDropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 185,
  },
  sortDropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  sortDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fffbeb',
  },
  sortDropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortDropdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
  },
  sortDropdownOptionsList: {
    paddingVertical: 4,
  },
  sortDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sortDropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  sortDropdownOptionActive: {
    backgroundColor: '#fef3c7',
  },
  sortOptionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sortOptionIconBoxActive: {
    backgroundColor: '#fde68a',
  },
  sortDropdownOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  sortDropdownOptionTextActive: {
    color: '#78350f',
    fontWeight: '800',
  },
  sortRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRadioOuterActive: {
    borderColor: '#b45309',
  },
  sortRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#b45309',
  },
});
