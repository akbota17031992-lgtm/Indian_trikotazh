import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALMATY_STORES_SEED, type AlmatyStoreSeed } from '@india-trikotaj/shared';

interface Props {
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
}

export function StoresScreen({ selectedStoreId, onSelectStore, locale, onToggleLocale }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const districts = [
    { id: 'all', titleRu: 'Все районы', titleKz: 'Барлық аудандар' },
    { id: 'bostandyk', titleRu: 'Бостандыкский', titleKz: 'Бостандық' },
    { id: 'medeu', titleRu: 'Медеуский', titleKz: 'Медеу' },
    { id: 'auezov', titleRu: 'Ауэзовский', titleKz: 'Әуезов' },
    { id: 'almaly', titleRu: 'Алмалинский', titleKz: 'Алмалы' },
    { id: 'zhetysu', titleRu: 'Жетысуский', titleKz: 'Жетісу' },
  ];

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`);
  };

  const handleOpen2Gis = (store: AlmatyStoreSeed) => {
    Linking.openURL(`https://2gis.kz/almaty/search/${encodeURIComponent(store.addressRu)}`);
  };

  const filteredStores = ALMATY_STORES_SEED.filter(store => {
    const q = searchQuery.toLowerCase();
    const name = locale === 'kz' ? store.nameKz.toLowerCase() : store.nameRu.toLowerCase();
    const address = locale === 'kz' ? store.addressKz.toLowerCase() : store.addressRu.toLowerCase();
    const matchesSearch = !q || name.includes(q) || address.includes(q);

    const matchesDistrict =
      selectedDistrict === 'all' ||
      (selectedDistrict === 'bostandyk' && store.districtRu.includes('Бостандык')) ||
      (selectedDistrict === 'medeu' && store.districtRu.includes('Медеу')) ||
      (selectedDistrict === 'auezov' && store.districtRu.includes('Ауэзов')) ||
      (selectedDistrict === 'almaly' && store.districtRu.includes('Алмал')) ||
      (selectedDistrict === 'zhetysu' && store.districtRu.includes('Жетысу'));

    return matchesSearch && matchesDistrict;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {locale === 'kz' ? 'Алматыдағы 16 дүкен' : '16 магазинов в Алматы'}
          </Text>
          <Text style={styles.subtitle}>
            {locale === 'kz'
              ? 'Өзіңізге жақын «Үнді трикотажы» филиалын таңдаңыз'
              : 'Выберите удобный филиал сети «Индийский Трикотаж»'}
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={locale === 'kz' ? 'СОО немесе көше бойынша іздеу...' : 'Поиск по ТРЦ или адресу...'}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* District Filter Chips */}
      <View style={{ marginBottom: 4 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={districts}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.districtList}
          renderItem={({ item: d }) => {
            const isActive = selectedDistrict === d.id;
            return (
              <TouchableOpacity
                style={[styles.districtChip, isActive && styles.districtChipActive]}
                onPress={() => setSelectedDistrict(d.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.districtText, isActive && styles.districtTextActive]}>
                  {locale === 'kz' ? d.titleKz : d.titleRu}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredStores}
        keyExtractor={item => item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const storeId = `store-almaty-${String(index + 1).padStart(3, '0')}`;
          const isSelected = storeId === selectedStoreId;

          return (
            <View style={[styles.card, isSelected && styles.cardSelected]}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeIndex}>
                  <Text style={styles.badgeIndexText}>#{index + 1}</Text>
                </View>
                <View style={styles.cardTitles}>
                  <Text style={styles.cardName}>
                    {locale === 'kz' ? item.nameKz : item.nameRu}
                  </Text>
                  <Text style={styles.cardAddress}>
                    {locale === 'kz' ? item.addressKz : item.addressRu}
                  </Text>
                  <Text style={styles.districtLabel}>{item.districtRu}</Text>
                </View>
                {isSelected && (
                  <View style={styles.activeCheck}>
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#64748b" />
                  <Text style={styles.metaLabel}>{item.openHoursRu}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={13} color="#64748b" />
                  <Text style={styles.metaLabel}>{item.phone}</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                  onPress={() => onSelectStore(storeId)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                    {isSelected
                      ? locale === 'kz'
                        ? '✓ Таңдалған филиал'
                        : '✓ Выбранный филиал'
                      : locale === 'kz'
                      ? 'Осы дүкенді таңдау'
                      : 'Выбрать этот магазин'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.twoGisBtn}
                  onPress={() => handleOpen2Gis(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.twoGisText}>2ГИС</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(item.phone)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={15} color="#047857" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fef3c7', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#fde68a', fontSize: 11, marginTop: 2 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
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
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  districtList: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  districtChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  districtChipActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  districtText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  districtTextActive: { color: '#ffffff', fontWeight: '700' },
  list: { padding: 14, paddingBottom: 28 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSelected: { borderColor: '#b45309', borderWidth: 1.5, backgroundColor: '#fffbeb' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  badgeIndex: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 8,
    marginTop: 2,
  },
  badgeIndexText: { color: '#92400e', fontSize: 11, fontWeight: '800' },
  cardTitles: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardAddress: { fontSize: 12, color: '#64748b', marginTop: 2 },
  districtLabel: { fontSize: 11, color: '#b45309', fontWeight: '700', marginTop: 2 },
  activeCheck: {
    backgroundColor: '#047857',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontSize: 11, color: '#475569' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  selectBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b45309',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  selectBtnActive: { backgroundColor: '#b45309' },
  selectBtnText: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  selectBtnTextActive: { color: '#ffffff' },
  twoGisBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoGisText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  callBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
});
