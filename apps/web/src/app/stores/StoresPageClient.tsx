'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Phone,
  ExternalLink,
  Check,
  Search,
  Clock,
  Navigation,
  Compass,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { useBranch, type StoreBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Input, Button, Badge, Card, CardContent } from '@india-trikotaj/ui';
import { formatTelLink, formatGoogleMapsUrl } from '../../lib/branch-constants';
import {
  calculateDistanceKm,
  ALMATY_DISTRICTS,
  ALMATY_LANDMARKS,
  type Coordinates,
  type LandmarkPreset,
} from '@india-trikotaj/shared';

function districtMatches(branchDistrict: string, districtId: string): boolean {
  if (districtId === 'all') return true;
  const dRu = branchDistrict.toLowerCase();
  switch (districtId) {
    case 'bostandyk':
      return dRu.includes('бостандык');
    case 'medeu':
      return dRu.includes('медеу');
    case 'almaly':
      return dRu.includes('алмал');
    case 'auezov':
      return dRu.includes('ауэзов');
    case 'zhetysu':
      return dRu.includes('жетысу');
    case 'turksib':
      return dRu.includes('турксиб');
    case 'nauryzbay':
      return dRu.includes('наурызбай');
    case 'alatau':
      return dRu.includes('алатау');
    default:
      return true;
  }
}

export function StoresPageClient() {
  const { branches, selectedBranch, selectBranch } = useBranch();
  const { locale, t } = useLocale();

  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // GPS Geolocation Handler
  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationNotice(null);
    setActiveLandmarkId(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsLocating(false);
          setLocationNotice(
            locale === 'kz'
              ? 'Геолокация анықталды. Ең жақын дүкендер жоғарыда көрсетілді'
              : 'Геолокация определена: филиалы отсортированы по удаленности от вас'
          );
        },
        error => {
          setIsLocating(false);
          setShowLandmarks(true);
          const denied = error.code === error.PERMISSION_DENIED;
          setLocationNotice(
            locale === 'kz'
              ? denied
                ? 'Геолокацияға рұқсат берілмеді. Төмендегі бағдарлардың бірін таңдаңыз:'
                : 'Геолокацияны анықтау мүмкін болмады. Бағдар таңдаңыз:'
              : denied
              ? 'Доступ к геопозиции не предоставлен. Выберите ориентир рядом с вами:'
              : 'Не удалось определить геопозицию. Выберите ориентир рядом с вами:'
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      setShowLandmarks(true);
      setLocationNotice(
        locale === 'kz'
          ? 'Браузерде геолокация қолдау таппайды. Бағдар таңдаңыз:'
          : 'Геолокация не поддерживается вашим браузером. Выберите ориентир:'
      );
    }
  };

  // Landmark selection
  const handleSelectLandmark = (landmark: LandmarkPreset) => {
    setUserCoords({
      latitude: landmark.latitude,
      longitude: landmark.longitude,
    });
    setActiveLandmarkId(landmark.id);
    setLocationNotice(
      locale === 'kz'
        ? `Бағдар: ${landmark.nameKz}. Ең жақын филиалдар жоғарыда`
        : `Ориентир: ${landmark.nameRu}. Филиалы отсортированы по удаленности`
    );
  };

  // Reset location & filters
  const handleResetLocation = () => {
    setUserCoords(null);
    setActiveLandmarkId(null);
    setShowLandmarks(false);
    setLocationNotice(null);
  };

  const handleClearAll = () => {
    handleResetLocation();
    setSearch('');
    setSelectedDistrict('all');
  };

  // Calculate distances for all branches
  const branchesWithDistance = useMemo(() => {
    return branches.map((b, index) => {
      let distanceKm: number | null = null;
      if (userCoords && typeof b.latitude === 'number' && typeof b.longitude === 'number') {
        distanceKm = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          b.latitude,
          b.longitude
        );
      }
      return {
        ...b,
        originalIndex: index,
        distanceKm,
      };
    });
  }, [branches, userCoords]);

  // District count calculation
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = { all: branches.length };
    branches.forEach(b => {
      const dRu = b.districtRu.toLowerCase();
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
  }, [branches]);

  // Filter & sort
  const filteredBranches = useMemo(() => {
    return branchesWithDistance
      .filter(b => {
        const name = locale === 'kz' ? b.nameKz : b.nameRu;
        const addr = locale === 'kz' ? b.addressKz : b.addressRu;
        const dist = locale === 'kz' ? b.districtKz : b.districtRu;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          name.toLowerCase().includes(q) ||
          addr.toLowerCase().includes(q) ||
          dist.toLowerCase().includes(q);
        const matchesDistrict = districtMatches(b.districtRu, selectedDistrict);
        return matchesSearch && matchesDistrict;
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.originalIndex - b.originalIndex;
      });
  }, [branchesWithDistance, search, selectedDistrict, locale]);

  const hasActiveFilters = Boolean(search || selectedDistrict !== 'all' || userCoords);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <span>{locale === 'kz' ? 'Алматыдағы 16 дүкен' : '16 магазинов в Алматы'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {locale === 'kz' ? 'Барлығы ашық' : 'Сеть филиалов'}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === 'kz'
              ? 'Алматы қаласының барлық аудандарындағы сауда орталықтары. Дайын тапсырысты 15 минутта тегін алып кету.'
              : 'Филиалы во всех районах Алматы. Быстрый бесплатный самовывоз готового интернет-заказа через 15 минут.'}
          </p>
        </div>

        {/* Selected Store Quick Info */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/60 border border-border text-xs">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {locale === 'kz' ? 'Таңдалған дүкен' : 'Текущий магазин самовывоза'}:
            </div>
            <div className="font-semibold text-foreground">
              {locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Geolocation, Landmarks, Search, District Filters */}
      <div className="space-y-4 p-5 rounded-2xl border border-border bg-card shadow-sm">
        {/* Top Control Bar: Search + Locate + Landmarks + Reset */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                locale === 'kz'
                  ? 'Дүкен немесе мекенжай бойынша іздеу...'
                  : 'Поиск по названию ТРЦ, улице, району...'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8 text-xs h-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* GPS Locate Button */}
            <Button
              type="button"
              variant={userCoords && !activeLandmarkId ? 'default' : 'outline'}
              size="sm"
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`h-9 text-xs gap-1.5 font-medium transition-all ${
                userCoords && !activeLandmarkId
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  : 'border-amber-600/30 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
              <span>{locale === 'kz' ? 'Маған жақын' : 'Рядом со мной'}</span>
            </Button>

            {/* Landmarks Toggle */}
            <Button
              type="button"
              variant={showLandmarks || activeLandmarkId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLandmarks(prev => !prev)}
              className={`h-9 text-xs gap-1.5 transition-all ${
                showLandmarks || activeLandmarkId
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{locale === 'kz' ? 'Бағдарлар' : 'Ориентиры'}</span>
            </Button>

            {/* Clear All / Reset Button */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
                title={locale === 'kz' ? 'Барлық сүзгілерді тазарту' : 'Сбросить все фильтры'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{locale === 'kz' ? 'Тазарту' : 'Сбросить'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Landmarks Preset Chips (Expandable) */}
        {showLandmarks && (
          <div className="pt-2 border-t border-border/60">
            <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>
                {locale === 'kz'
                  ? 'Алматы бағдарлары (жақын дүкендерді көру үшін басыңыз):'
                  : 'Быстрые ориентиры Алматы (нажмите, чтобы отсортировать по удаленности):'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALMATY_LANDMARKS.map(landmark => {
                const isActive = activeLandmarkId === landmark.id;
                return (
                  <button
                    key={landmark.id}
                    type="button"
                    onClick={() => handleSelectLandmark(landmark)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-foreground border-border/80'
                    }`}
                  >
                    📍 {locale === 'kz' ? landmark.nameKz : landmark.nameRu}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Location Notice Banner */}
        {locationNotice && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationNotice}</span>
            </div>
            {userCoords && (
              <button
                type="button"
                onClick={handleResetLocation}
                className="text-[11px] underline text-amber-800 dark:text-amber-300 hover:text-amber-950 ml-3 shrink-0"
              >
                {locale === 'kz' ? 'Өшіру' : 'Отменить'}
              </button>
            )}
          </div>
        )}

        {/* District Filter Chips */}
        <div className="pt-2 border-t border-border/60">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2">
            {locale === 'kz' ? 'Аудандар бойынша сүзу:' : 'Фильтр по районам города:'}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {ALMATY_DISTRICTS.map(district => {
              const count = districtCounts[district.id] || 0;
              const isSelected = selectedDistrict === district.id;
              const label = locale === 'kz' ? district.nameKz : district.nameRu;

              return (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => setSelectedDistrict(district.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all ${
                    isSelected
                      ? 'bg-foreground text-background border-foreground shadow-sm'
                      : 'bg-secondary/70 hover:bg-secondary text-secondary-foreground border-border/80'
                  }`}
                >
                  {label} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stores Counter & Active Filter Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div>
          {locale === 'kz' ? 'Табылған дүкендер' : 'Найдено филиалов'}:{' '}
          <strong className="text-foreground">{filteredBranches.length}</strong>{' '}
          {locale === 'kz' ? '16 ішінен' : 'из 16'}
          {userCoords && (
            <span className="ml-2 font-medium text-amber-700 dark:text-amber-400">
              (📍 {locale === 'kz' ? 'жақыннан алысқа қарай' : 'по возрастанию расстояния'})
            </span>
          )}
        </div>
      </div>

      {/* Stores Grid */}
      {filteredBranches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
          <MapPin className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-base text-foreground">
            {locale === 'kz' ? 'Дүкендер табылмады' : 'Магазины не найдены'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {locale === 'kz'
              ? 'Іздеу сұрауын өзгертіп көріңіз немесе аудан сүзгісін тазартыңыз'
              : 'Попробуйте изменить поисковый запрос или сбросить фильтр по районам'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="mt-4 text-xs h-8"
          >
            {locale === 'kz' ? 'Барлық сүзгілерді тазарту' : 'Показать все 16 филиалов'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map(branch => {
            const isSelected = branch.id === selectedBranch.id;
            const name = locale === 'kz' ? branch.nameKz : branch.nameRu;
            const address = locale === 'kz' ? branch.addressKz : branch.addressRu;
            const schedule = locale === 'kz' ? branch.openHoursKz : branch.openHoursRu;
            const district = locale === 'kz' ? branch.districtKz : branch.districtRu;
            const telLink = formatTelLink(branch.phone);
            const googleMapsUrl = formatGoogleMapsUrl(branch.latitude, branch.longitude);
            const twoGisUrl = `https://2gis.kz/almaty/search/${encodeURIComponent(branch.addressRu)}`;

            return (
              <Card
                key={branch.id}
                className={`flex flex-col justify-between transition-all duration-200 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                    : 'border-border/80 hover:border-border hover:shadow-md bg-card'
                }`}
              >
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header: Title + Current Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-foreground leading-snug">
                        {name}
                      </h3>
                      {isSelected && (
                        <Badge variant="default" className="text-[10px] shrink-0 bg-primary font-medium">
                          <Check className="w-3 h-3 mr-0.5" /> {t('current')}
                        </Badge>
                      )}
                    </div>

                    {/* District & Distance Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-medium bg-muted/30">
                        {district}
                      </Badge>

                      {branch.distanceKm !== null && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                        >
                          📍 {branch.distanceKm} {locale === 'kz' ? 'км қашықта' : 'км от вас'}
                        </Badge>
                      )}
                    </div>

                    {/* Address & Hours */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{schedule}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Phone + Maps (2GIS, Google) + Select */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1">
                      {/* Phone */}
                      <a
                        href={telLink}
                        className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
                        title={branch.phone}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">{branch.phone}</span>
                      </a>

                      {/* 2GIS (Kazakhstan's #1 navigation map) */}
                      <a
                        href={twoGisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors font-semibold"
                        title="Открыть в 2GIS"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-[11px]">2ГИС</span>
                      </a>

                      {/* Google Maps */}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
                        title={t('openInMap')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-[11px]">Google</span>
                      </a>
                    </div>

                    {/* Select Store for pickup */}
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => selectBranch(branch.id)}
                      className={`text-xs h-8 font-medium transition-all ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'hover:border-primary'
                      }`}
                    >
                      {isSelected ? t('selected') : t('select')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
