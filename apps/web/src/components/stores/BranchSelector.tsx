'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Phone, ExternalLink, Check, Search } from 'lucide-react';
import { useBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
  Input,
} from '@india-trikotaj/ui';
import { formatTelLink, formatGoogleMapsUrl } from '../../lib/branch-constants';


export function BranchSelector() {
  const { selectedBranch, branches, selectBranch } = useBranch();
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (id: string) => {
    selectBranch(id);
    setIsOpen(false);
  };

  const currentBranchName = locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 text-xs sm:text-sm font-medium border-border/80 hover:bg-muted/50 max-w-[200px] sm:max-w-[280px]"
        >
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{currentBranchName}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold">
            {t('selectBranchTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('selectBranchSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Search & District Filter */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchBranchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
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

        {/* Branch List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pt-2">
          {filteredBranches.map(branch => {
            const isSelected = branch.id === selectedBranch.id;
            const name = locale === 'kz' ? branch.nameKz : branch.nameRu;
            const address = locale === 'kz' ? branch.addressKz : branch.addressRu;
            const schedule = locale === 'kz' ? branch.openHoursKz : branch.openHoursRu;
            const district = locale === 'kz' ? branch.districtKz : branch.districtRu;
            const telLink = formatTelLink(branch.phone);
            const mapsUrl = formatGoogleMapsUrl(branch.latitude, branch.longitude);

            return (
              <div
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-border/80 hover:bg-muted/40'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-base text-foreground">{name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {district}
                    </Badge>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary">
                        <Check className="h-3 w-3 mr-0.5" /> {t('currentStore')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{address}</p>
                  <p className="text-xs text-muted-foreground/80">{schedule}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0" onClick={e => e.stopPropagation()}>
                  <a
                    href={telLink}
                    className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                    title={branch.phone}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{branch.phone}</span>
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                    title={t('openInMap')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{t('map')}</span>
                  </a>
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelect(branch.id)}
                    className="text-xs h-8"
                  >
                    {isSelected ? t('selected') : t('select')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
