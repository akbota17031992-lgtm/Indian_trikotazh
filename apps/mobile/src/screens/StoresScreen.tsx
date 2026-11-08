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
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={locale === 'kz' ? 'СОО немесе көше бойынша іздеу...' : 'Поиск по ТРЦ или адресу...'}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* District Filter Chips */}
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={districts}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.districtList}
          renderItem={({ item: d }) => (
            <TouchableOpacity
              style={[styles.districtChip, selectedDistrict === d.id && styles.districtChipActive]}
              onPress={() => setSelectedDistrict(d.id)}
            >
              <Text style={[styles.districtText, selectedDistrict === d.id && styles.districtTextActive]}>
                {locale === 'kz' ? d.titleKz : d.titleRu}
              </Text>
            </TouchableOpacity>
          )}
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
                    <Text style={styles.activeCheckText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>🕒 {item.openHoursRu}</Text>
                <Text style={styles.metaLabel}>📞 {item.phone}</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                  onPress={() => onSelectStore(storeId)}
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
                >
                  <Text style={styles.twoGisText}>2ГИС</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(item.phone)}
                >
                  <Text style={styles.callText}>📞</Text>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fef3c7', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#fde68a', fontSize: 11, marginTop: 2 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 10 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  districtList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  districtChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  districtChipActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  districtText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  districtTextActive: { color: '#ffffff', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardSelected: { borderColor: '#b45309', borderWidth: 2, backgroundColor: '#fffbeb' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  badgeIndex: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
  },
  badgeIndexText: { color: '#92400e', fontSize: 11, fontWeight: '700' },
  cardTitles: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  cardAddress: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  districtLabel: { fontSize: 11, color: '#b45309', fontWeight: '600', marginTop: 2 },
  activeCheck: {
    backgroundColor: '#047857',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  metaRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 4 },
  metaLabel: { fontSize: 11, color: '#4b5563' },
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
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: { fontSize: 14 },
});
