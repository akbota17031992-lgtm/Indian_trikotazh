import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ALMATY_STORES_SEED,
  type AlmatyStoreSeed,
  ALMATY_DISTRICTS,
  ALMATY_LANDMARKS,
  calculateDistanceKm,
  type Coordinates,
} from '@india-trikotaj/shared';

interface Props {
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
}

export function StoresScreen({ selectedStoreId, onSelectStore, locale, onToggleLocale }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Request GPS position or show landmarks
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationNotice(null);
    setActiveLandmarkId(null);

    const geo = typeof navigator !== 'undefined' ? (navigator as any).geolocation : null;
    if (geo && typeof geo.getCurrentPosition === 'function') {
      geo.getCurrentPosition(
        (pos: any) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsLocating(false);
          setLocationNotice(
            locale === 'kz'
              ? 'Геолокация анықталды. Ең жақын дүкендер көрсетілді'
              : 'Геолокация определена. Ближайшие филиалы наверху'
          );
        },
        () => {
          setIsLocating(false);
          setShowLandmarks(true);
          setLocationNotice(
            locale === 'kz'
              ? 'Геолокацияға рұқсат берілмеді. Өзіңізге жақын бағдарды таңдаңыз:'
              : 'Доступ к геопозиции не предоставлен. Выберите ориентир рядом с вами:'
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      setShowLandmarks(true);
      setLocationNotice(
        locale === 'kz'
          ? 'Өзіңізге жақын бағдарды таңдаңыз:'
          : 'Выберите ориентир рядом с вами:'
      );
    }
  };

  const handleSelectLandmark = (landmark: (typeof ALMATY_LANDMARKS)[0]) => {
    setUserCoords({
      latitude: landmark.latitude,
      longitude: landmark.longitude,
    });
    setActiveLandmarkId(landmark.id);
    setLocationNotice(
      locale === 'kz'
        ? `Бағдар: ${landmark.nameKz}`
        : `Ориентир: ${landmark.nameRu}`
    );
  };

  const handleResetLocation = () => {
    setUserCoords(null);
    setActiveLandmarkId(null);
    setShowLandmarks(false);
    setLocationNotice(null);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`);
  };

  const handleOpen2Gis = (store: AlmatyStoreSeed) => {
    Linking.openURL(`https://2gis.kz/almaty/search/${encodeURIComponent(store.addressRu)}`);
  };

  // Calculate distances
  const storesWithDistance = useMemo(() => {
    return ALMATY_STORES_SEED.map((store, index) => {
      const storeId = `store-almaty-${String(index + 1).padStart(3, '0')}`;
      let distanceKm: number | null = null;
      if (userCoords) {
        distanceKm = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          store.latitude,
          store.longitude
        );
      }
      return {
        ...store,
        storeId,
        originalIndex: index,
        distanceKm,
      };
    });
  }, [userCoords]);

  // Filter & sort
  const filteredStores = useMemo(() => {
    return storesWithDistance
      .filter(store => {
        const q = searchQuery.toLowerCase().trim();
        const name = (locale === 'kz' ? store.nameKz : store.nameRu).toLowerCase();
        const address = (locale === 'kz' ? store.addressKz : store.addressRu).toLowerCase();
        const district = (locale === 'kz' ? store.districtKz : store.districtRu).toLowerCase();
        const matchesSearch = !q || name.includes(q) || address.includes(q) || district.includes(q);

        const matchesDistrict =
          selectedDistrict === 'all' ||
          store.districtRu.toLowerCase().includes(
            selectedDistrict === 'bostandyk'
              ? 'бостандык'
              : selectedDistrict === 'medeu'
              ? 'медеу'
              : selectedDistrict === 'auezov'
              ? 'ауэзов'
              : selectedDistrict === 'almaly'
              ? 'алмал'
              : selectedDistrict === 'zhetysu'
              ? 'жетысу'
              : selectedDistrict === 'turksib'
              ? 'турксиб'
              : selectedDistrict === 'nauryzbay'
              ? 'наурызбай'
              : selectedDistrict === 'alatau'
              ? 'алатау'
              : selectedDistrict
          );

        return matchesSearch && matchesDistrict;
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.originalIndex - b.originalIndex;
      });
  }, [storesWithDistance, searchQuery, selectedDistrict, locale]);

  // Count stores per district
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALMATY_STORES_SEED.length };
    ALMATY_STORES_SEED.forEach(s => {
      const dRu = s.districtRu.toLowerCase();
      if (dRu.includes('бостандык')) counts.bostandyk = (counts.bostandyk || 0) + 1;
      else if (dRu.includes('медеу')) counts.medeu = (counts.medeu || 0) + 1;
      else if (dRu.includes('алмал')) counts.almaly = (counts.almaly || 0) + 1;
      else if (dRu.includes('ауэзов')) counts.auezov = (counts.auezov || 0) + 1;
      else if (dRu.includes('жетысу')) counts.zhetysu = (counts.zhetysu || 0) + 1;
      else if (dRu.includes('турксиб')) counts.turksib = (counts.turksib || 0) + 1;
      else if (dRu.includes('наурызбай')) counts.nauryzbay = (counts.nauryzbay || 0) + 1;
      else if (dRu.includes('алатау')) counts.alatau = (counts.alatau || 0) + 1;
    });
    return counts;
  }, []);

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

      {/* Location Filter Toolbar (Рядом со мной / Ориентир) */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={[styles.locateBtn, userCoords && !activeLandmarkId && styles.locateBtnActive]}
          onPress={handleLocateMe}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
          ) : (
            <Ionicons
              name="navigate"
              size={15}
              color={userCoords && !activeLandmarkId ? '#ffffff' : '#b45309'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.locateBtnText,
              userCoords && !activeLandmarkId && styles.locateBtnTextActive,
            ]}
          >
            {locale === 'kz' ? 'Маған жақын' : 'Рядом со мной'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.landmarksToggleBtn, (showLandmarks || activeLandmarkId) && styles.landmarksToggleBtnActive]}
          onPress={() => setShowLandmarks(prev => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="map-outline"
            size={14}
            color={showLandmarks || activeLandmarkId ? '#b45309' : '#475569'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.landmarksToggleText,
              (showLandmarks || activeLandmarkId) && styles.landmarksToggleTextActive,
            ]}
          >
            {locale === 'kz' ? 'Бағдар таңдау' : 'Ориентиры'}
          </Text>
          <Ionicons
            name={showLandmarks ? 'chevron-up' : 'chevron-down'}
            size={12}
            color="#64748b"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>

        {userCoords && (
          <TouchableOpacity
            style={styles.resetLocationBtn}
            onPress={handleResetLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={14} color="#dc2626" style={{ marginRight: 3 }} />
            <Text style={styles.resetLocationText}>
              {locale === 'kz' ? 'Тазарту' : 'Сброс'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location Status Notice */}
      {locationNotice && (
        <View style={styles.noticeBar}>
          <Ionicons name="information-circle" size={14} color="#b45309" style={{ marginRight: 6 }} />
          <Text style={styles.noticeText} numberOfLines={2}>
            {locationNotice}
          </Text>
        </View>
      )}

      {/* Landmark Quick Chips */}
      {showLandmarks && (
        <View style={styles.landmarksWrapper}>
          <Text style={styles.landmarksHeading}>
            {locale === 'kz' ? 'Өзіңіз тұрған ауданды таңдаңыз:' : 'Ориентир рядом с вами:'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.landmarksList}
          >
            {ALMATY_LANDMARKS.map(landmark => {
              const isActive = activeLandmarkId === landmark.id;
              return (
                <TouchableOpacity
                  key={landmark.id}
                  style={[styles.landmarkChip, isActive && styles.landmarkChipActive]}
                  onPress={() => handleSelectLandmark(landmark)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location-sharp"
                    size={12}
                    color={isActive ? '#ffffff' : '#b45309'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.landmarkChipText, isActive && styles.landmarkChipTextActive]}
                  >
                    {locale === 'kz' ? landmark.nameKz : landmark.nameRu}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={
              locale === 'kz'
                ? 'СОО, көше, мекенжай немесе аудан бойынша іздеу...'
                : 'Поиск по ТРЦ, улице, адресу или району...'
            }
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* All 8 Almaty Districts Filter Chips */}
      <View style={{ marginBottom: 4 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ALMATY_DISTRICTS}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.districtList}
          renderItem={({ item: d }) => {
            const isActive = selectedDistrict === d.id;
            const count = districtCounts[d.id] ?? 0;
            if (d.id !== 'all' && count === 0) return null;

            return (
              <TouchableOpacity
                style={[styles.districtChip, isActive && styles.districtChipActive]}
                onPress={() => setSelectedDistrict(d.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.districtText, isActive && styles.districtTextActive]}>
                  {locale === 'kz' ? d.nameKz : d.nameRu} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Stores List */}
      <FlatList
        data={filteredStores}
        keyExtractor={item => item.slug}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>
              {locale === 'kz' ? 'Дүкендер табылмады' : 'Магазины не найдены'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {locale === 'kz'
                ? 'Басқа ауданды таңдап көріңіз'
                : 'Попробуйте изменить поисковый запрос или выбрать другой район'}
            </Text>
            <TouchableOpacity
              style={styles.resetDistrictBtn}
              onPress={() => {
                setSelectedDistrict('all');
                setSearchQuery('');
                handleResetLocation();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetDistrictBtnText}>
                {locale === 'kz' ? 'Барлық дүкендерді көрсету' : 'Показать все магазины'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const isSelected = item.storeId === selectedStoreId;

          return (
            <View style={[styles.card, isSelected && styles.cardSelected]}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeIndex}>
                  <Text style={styles.badgeIndexText}>#{item.originalIndex + 1}</Text>
                </View>
                <View style={styles.cardTitles}>
                  <Text style={styles.cardName}>
                    {locale === 'kz' ? item.nameKz : item.nameRu}
                  </Text>
                  <Text style={styles.cardAddress}>
                    {locale === 'kz' ? item.addressKz : item.addressRu}
                  </Text>
                  <View style={styles.districtBadgeRow}>
                    <Text style={styles.districtLabel}>
                      {locale === 'kz' ? item.districtKz : item.districtRu}
                    </Text>

                    {/* Proximity / Distance Badge */}
                    {item.distanceKm !== null && (
                      <View style={styles.distanceBadge}>
                        <Ionicons name="navigate" size={10} color="#059669" />
                        <Text style={styles.distanceBadgeText}>
                          {item.distanceKm < 1
                            ? `${Math.round(item.distanceKm * 1000)} м от вас`
                            : `${item.distanceKm} км от вас`}
                        </Text>
                      </View>
                    )}
                  </View>
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
                  <Text style={styles.metaLabel}>
                    {locale === 'kz' ? item.openHoursKz : item.openHoursRu}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={13} color="#64748b" />
                  <Text style={styles.metaLabel}>{item.phone}</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
                  onPress={() => onSelectStore(item.storeId)}
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
                  <Ionicons name="map" size={13} color="#ffffff" style={{ marginRight: 4 }} />
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
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  locateBtnActive: {
    backgroundColor: '#b45309',
    borderColor: '#b45309',
  },
  locateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  locateBtnTextActive: {
    color: '#ffffff',
  },
  landmarksToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  landmarksToggleBtnActive: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  landmarksToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  landmarksToggleTextActive: {
    color: '#92400e',
    fontWeight: '700',
  },
  resetLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  resetLocationText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 14,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noticeText: {
    fontSize: 11,
    color: '#78350f',
    fontWeight: '600',
    flex: 1,
  },
  landmarksWrapper: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  landmarksHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  landmarksList: {
    gap: 6,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  landmarkChipActive: {
    backgroundColor: '#78350f',
    borderColor: '#78350f',
  },
  landmarkChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  landmarkChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchContainer: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 6 },
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
  districtBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  districtLabel: { fontSize: 11, color: '#b45309', fontWeight: '700' },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
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
    flexDirection: 'row',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetDistrictBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  resetDistrictBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
