'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Phone, ExternalLink, Check, Search, Clock } from 'lucide-react';
import { useBranch, type StoreBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Input, Button, Badge, Card, CardContent } from '@india-trikotaj/ui';
import { formatTelLink, formatGoogleMapsUrl } from '../../lib/branch-constants';


export function StoresPageClient() {
  const { branches, selectedBranch, selectBranch } = useBranch();
  const { locale, t } = useLocale();

  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const districts = useMemo(() => {
    const list = Array.from(new Set(branches.map(b => (locale === 'kz' ? b.districtKz : b.districtRu))));
    return ['all', ...list];
  }, [branches, locale]);

  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const name = locale === 'kz' ? b.nameKz : b.nameRu;
      const addr = locale === 'kz' ? b.addressKz : b.addressRu;
      const dist = locale === 'kz' ? b.districtKz : b.districtRu;
      const matchesSearch =
        !search.trim() ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        addr.toLowerCase().includes(search.toLowerCase());
      const matchesDistrict = selectedDistrict === 'all' || dist === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [branches, search, selectedDistrict, locale]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {t('stores')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === 'kz'
            ? 'Алматы қаласының сауда орталықтарында 16 бөлшек сауда дүкені. Дайын тапсырысты 15 минутта тегін алып кету.'
            : '16 розничных магазинов в торговых центрах Алматы. Бесплатный самовывоз готового заказа через 15 минут.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchBranchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {districts.map(d => (
            <Button
              key={d}
              variant={selectedDistrict === d ? 'default' : 'secondary'}
              size="sm"
              className="h-7 text-xs px-2.5 rounded-full shrink-0"
              onClick={() => setSelectedDistrict(d)}
            >
              {d === 'all' ? t('allDistricts') : d}
            </Button>
          ))}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map(branch => {
          const isSelected = branch.id === selectedBranch.id;
          const name = locale === 'kz' ? branch.nameKz : branch.nameRu;
          const address = locale === 'kz' ? branch.addressKz : branch.addressRu;
          const schedule = locale === 'kz' ? branch.openHoursKz : branch.openHoursRu;
          const district = locale === 'kz' ? branch.districtKz : branch.districtRu;
          const telLink = formatTelLink(branch.phone);
          const mapsUrl = formatGoogleMapsUrl(branch.latitude, branch.longitude);

          return (
            <Card
              key={branch.id}
              className={`flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border/80 hover:border-border hover:shadow-md'
              }`}
            >
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {name}
                    </h3>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] shrink-0 bg-primary">
                        <Check className="w-3 h-3 mr-0.5" /> {t('current')}
                      </Badge>
                    )}
                  </div>

                  <Badge variant="outline" className="text-[11px] font-medium">
                    {district}
                  </Badge>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <a
                      href={telLink}
                      className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                      title={branch.phone}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{branch.phone}</span>
                    </a>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                      title={t('openInMap')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('map')}</span>
                    </a>
                  </div>

                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => selectBranch(branch.id)}
                    className="text-xs h-8"
                  >
                    {isSelected ? t('selected') : t('select')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
