import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { ALMATY_STORES_SEED, type AlmatyStoreSeed } from '@india-trikotaj/shared';

interface Props {
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
}

export function StoresScreen({ selectedStoreId, onSelectStore, locale }: Props) {
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`);
  };

  const handleOpen2Gis = (store: AlmatyStoreSeed) => {
    Linking.openURL(`https://2gis.kz/almaty/search/${encodeURIComponent(store.addressRu)}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {locale === 'kz' ? 'Алматыдағы 16 дүкен' : '16 магазинов в Алматы'}
        </Text>
        <Text style={styles.subtitle}>
          {locale === 'kz'
            ? 'Өзіңізге жақын «Үнді трикотажы» филиалын таңдаңыз'
            : 'Выберите удобный филиал сети «Индийский Трикотаж»'}
        </Text>
      </View>

      <FlatList
        data={ALMATY_STORES_SEED}
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
                </View>
                {isSelected && (
                  <View style={styles.activeCheck}>
                    <Text style={styles.activeCheckText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>🕒 10:00 – 20:00 (күн сайын / ежедневно)</Text>
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
  },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#fde68a', marginTop: 2 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardSelected: { borderColor: '#b45309', backgroundColor: '#fffbeb' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  badgeIndex: {
    backgroundColor: '#fef3c7',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeIndexText: { color: '#92400e', fontSize: 12, fontWeight: '800' },
  cardTitles: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardAddress: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  activeCheck: {
    backgroundColor: '#059669',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  metaRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 2 },
  metaLabel: { fontSize: 11, color: '#4b5563' },
  buttonRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  selectBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnActive: { backgroundColor: '#b45309' },
  selectBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  selectBtnTextActive: { color: '#ffffff' },
  twoGisBtn: {
    backgroundColor: '#22c55e',
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
