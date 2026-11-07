'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';
import { useBranch } from '../../contexts/BranchContext';
import { MVP_CATEGORIES_SEED, formatKZT } from '@india-trikotaj/shared';

export interface CatalogFilterState {
  search: string;
  category: string;
  gender: string;
  season: string;
  size: string;
  brand: string;
  collection: string;
  color: string;
  minPrice: number;
  maxPrice: number;
  sortBy: 'popular' | 'price_asc' | 'price_desc' | 'name';
  inStockOnly: boolean;
}

interface CatalogFiltersProps {
  filters: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  onReset: () => void;
}

// 1. Расширенный фильтр "Кому" (как на Kaspi: Девочкам, Мальчикам, Малышам)
const GENDERS = [
  { id: 'women', labelRu: 'Женщинам', labelKz: 'Әйелдерге', count: 1756 },
  { id: 'men', labelRu: 'Мужчинам', labelKz: 'Ерлерге', count: 503 },
  { id: 'girls', labelRu: 'Девочкам', labelKz: 'Қыздарға', count: 221 },
  { id: 'boys', labelRu: 'Мальчикам', labelKz: 'Ұлдарға', count: 170 },
  { id: 'babies', labelRu: 'Одежда для малышей (0-3 года)', labelKz: 'Сәбилерге (0-3 жас)', count: 132 },
  { id: 'teens', labelRu: 'Подросткам', labelKz: 'Жасөспірімдерге', count: 98 },
];

// 2. Огромная линейка размеров (взрослые + детские по росту и возрасту)
const ALL_SIZES = [
  // Взрослые размеры
  { val: '38', label: '38 (XXS)', group: 'adult' },
  { val: '40', label: '40 (XS)', group: 'adult' },
  { val: '42', label: '42 (S)', group: 'adult' },
  { val: '44', label: '44 (S/M)', group: 'adult' },
  { val: '46', label: '46 (M)', group: 'adult' },
  { val: '48', label: '48 (L)', group: 'adult' },
  { val: '50', label: '50 (L/XL)', group: 'adult' },
  { val: '52', label: '52 (XL)', group: 'adult' },
  { val: '54', label: '54 (2XL)', group: 'adult' },
  { val: '56', label: '56 (3XL)', group: 'adult' },
  { val: '58', label: '58 (4XL)', group: 'adult' },
  { val: '60', label: '60 (5XL Plus Size)', group: 'adult' },
  // Детские по росту (см)
  { val: '68', label: '68 см (3-6 мес)', group: 'kids' },
  { val: '74', label: '74 см (6-9 мес)', group: 'kids' },
  { val: '80', label: '80 см (9-12 мес)', group: 'kids' },
  { val: '86', label: '86 см (1-1.5 года)', group: 'kids' },
  { val: '92', label: '92 см (2 года)', group: 'kids' },
  { val: '98', label: '98 см (3 года)', group: 'kids' },
  { val: '104', label: '104 см (4 года)', group: 'kids' },
  { val: '110', label: '110 см (5 лет)', group: 'kids' },
  { val: '116', label: '116 см (6 лет)', group: 'kids' },
  { val: '122', label: '122 см (7 лет)', group: 'kids' },
  { val: '128', label: '128 см (8 лет)', group: 'kids' },
  { val: '134', label: '134 см (9 лет)', group: 'kids' },
  { val: '140', label: '140 см (10 лет)', group: 'kids' },
  { val: '146', label: '146 см (11 лет)', group: 'kids' },
  { val: '152', label: '152 см (12 лет)', group: 'kids' },
  { val: '158', label: '158 см (13 лет)', group: 'kids' },
];

// 3. Широчайшая цветовая палитра как на Kaspi
const ALL_COLORS = [
  { id: 'айвори', label: 'айвори', hex: '#FFFFF0', border: true },
  { id: 'антрацит', label: 'антрацит', hex: '#293133' },
  { id: 'бежевый', label: 'бежевый', hex: '#F5F5DC', border: true },
  { id: 'белый', label: 'белый', hex: '#FFFFFF', border: true },
  { id: 'бирюзовый', label: 'бирюзовый', hex: '#30D5C8' },
  { id: 'бледно-голубой', label: 'бледно-голубой', hex: '#AFEEEE' },
  { id: 'бледно-зеленый', label: 'бледно-зеленый', hex: '#98FB98' },
  { id: 'бледно-розовый', label: 'бледно-розовый', hex: '#FFB6C1' },
  { id: 'бордовый', label: 'бордовый', hex: '#800020' },
  { id: 'голубой', label: 'голубой', hex: '#42AAFF' },
  { id: 'горчичный', label: 'горчичный', hex: '#E1AD01' },
  { id: 'графит', label: 'графит', hex: '#383838' },
  { id: 'желтый', label: 'желтый', hex: '#FFD700' },
  { id: 'зеленый', label: 'зеленый', hex: '#008000' },
  { id: 'индиго', label: 'индиго', hex: '#4B0082' },
  { id: 'коричневый', label: 'коричневый', hex: '#8B4513' },
  { id: 'красный', label: 'красный', hex: '#FF0000' },
  { id: 'лавандовый', label: 'лавандовый', hex: '#E6E6FA', border: true },
  { id: 'лимонный', label: 'лимонный', hex: '#FDE910' },
  { id: 'мятный', label: 'мятный', hex: '#98FF98' },
  { id: 'оливковый', label: 'оливковый', hex: '#808000' },
  { id: 'оранжевый', label: 'оранжевый', hex: '#FFA500' },
  { id: 'персиковый', label: 'персиковый', hex: '#FFE5B4', border: true },
  { id: 'пудровый', label: 'пудровый', hex: '#E8CCD7' },
  { id: 'розовый', label: 'розовый', hex: '#FFC0CB' },
  { id: 'салатовый', label: 'салатовый', hex: '#7FFF00' },
  { id: 'светло-серый', label: 'светло-серый', hex: '#D3D3D3' },
  { id: 'серый', label: 'серый', hex: '#808080' },
  { id: 'синий', label: 'синий', hex: '#0000FF' },
  { id: 'сиреневый', label: 'сиреневый', hex: '#C8A2C8' },
  { id: 'темно-синий', label: 'темно-синий', hex: '#00008B' },
  { id: 'терракотовый', label: 'терракотовый', hex: '#E2725B' },
  { id: 'фиолетовый', label: 'фиолетовый', hex: '#8B00FF' },
  { id: 'хаки', label: 'хаки', hex: '#78866B' },
  { id: 'черный', label: 'черный', hex: '#000000' },
  { id: 'шоколадный', label: 'шоколадный', hex: '#3D1C02' },
];

const BRANDS = [
  { id: 'India Trikotaj', label: 'India Trikotaj (Оригинал)', count: 24 },
  { id: 'Bombay Cotton', label: 'Bombay Cotton Kids', count: 12 },
  { id: 'Delhi Mills', label: 'Delhi Mills Organic', count: 9 },
  { id: 'Gujarat Organic', label: 'Gujarat Organic Pure', count: 7 },
  { id: 'Kolkata Knits', label: 'Kolkata Knits Home', count: 5 },
];

const ABSOLUTE_MIN_PRICE = 1000;
const ABSOLUTE_MAX_PRICE = 50000;

export function CatalogFilters({ filters, onChange, onReset }: CatalogFiltersProps) {
  const { locale } = useLocale();
  const { selectedBranch } = useBranch();
  const currentBranchName = locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu;

  // Раскрывающиеся секции "Показать еще"
  const [showAllGenders, setShowAllGenders] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [sizeTab, setSizeTab] = useState<'all' | 'adult' | 'kids'>('all');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  // Фильтр списка размеров по вкладке
  const filteredSizes = ALL_SIZES.filter(s => sizeTab === 'all' || s.group === sizeTab);
  const displayedSizes = showAllSizes ? filteredSizes : filteredSizes.slice(0, 7);

  // Фильтр списка цветов
  const displayedColors = showAllColors ? ALL_COLORS : ALL_COLORS.slice(0, 8);

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.gender !== 'all' ||
    filters.size !== 'all' ||
    filters.brand !== 'all' ||
    filters.color !== 'all' ||
    filters.inStockOnly ||
    filters.minPrice > ABSOLUTE_MIN_PRICE ||
    filters.maxPrice < ABSOLUTE_MAX_PRICE ||
    !!filters.search;

  // Двусторонний бегунок цен
  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), filters.maxPrice - 500);
    onChange({ ...filters, minPrice: val });
  };

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), filters.minPrice + 500);
    onChange({ ...filters, maxPrice: val });
  };

  // Расчет процентов заполнения трека слайдера
  const minPercent = ((filters.minPrice - ABSOLUTE_MIN_PRICE) / (ABSOLUTE_MAX_PRICE - ABSOLUTE_MIN_PRICE)) * 100;
  const maxPercent = ((filters.maxPrice - ABSOLUTE_MIN_PRICE) / (ABSOLUTE_MAX_PRICE - ABSOLUTE_MIN_PRICE)) * 100;

  return (
    <aside className="w-full bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-4 text-[13px] text-neutral-800 space-y-5">
      {/* Поиск внутри категории */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Поиск в каталоге..."
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-3 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0089D0] transition-colors"
        />
      </div>

      {/* Кнопка сброса */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs">
          <span className="text-neutral-500 font-medium">Применены фильтры</span>
          <button
            type="button"
            onClick={onReset}
            className="text-[#0089D0] hover:text-[#0073B0] font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Сбросить все</span>
          </button>
        </div>
      )}

      {/* 1. Иерархическое дерево категорий Kaspi */}
      <div className="space-y-1.5 pb-4 border-b border-neutral-200/70">
        <button
          type="button"
          onClick={() => onChange({ ...filters, category: 'all' })}
          className={`font-semibold hover:underline flex items-center gap-1 ${
            filters.category === 'all' ? 'text-[#0089D0]' : 'text-neutral-900'
          }`}
        >
          <span>Все категории</span>
          <span className="text-neutral-400 text-xs font-normal">(24)</span>
        </button>

        <div className="pl-2 pt-1 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-neutral-900">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="text-neutral-500 hover:text-neutral-900"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoriesOpen ? '' : '-rotate-90'}`} />
            </button>
            <span>Одежда и трикотаж</span>
            <span className="text-neutral-400 text-xs font-normal">(24)</span>
          </div>

          {isCategoriesOpen && (
            <div className="pl-5 space-y-1 pt-1">
              {MVP_CATEGORIES_SEED.map(c => {
                const isSelected = filters.category === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => onChange({ ...filters, category: isSelected ? 'all' : c.slug })}
                    className="flex items-center gap-1.5 text-left w-full group py-0.5"
                  >
                    <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-[#0089D0]" />
                    <span
                      className={`text-xs hover:underline ${
                        isSelected ? 'font-bold text-[#0089D0]' : 'text-[#0089D0]'
                      }`}
                    >
                      {locale === 'kz' ? c.nameKz : c.nameRu}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Двусторонний ценовой бегунок (Range Slider) */}
      <div className="space-y-3 pb-4 border-b border-neutral-200/70">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Цена (₸)</span>
          </h4>
          <span className="text-[11px] font-bold text-neutral-700">
            {formatKZT(filters.minPrice)} — {formatKZT(filters.maxPrice)}
          </span>
        </div>

        {/* Инпуты ввода от и до */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-neutral-400">от</span>
            <input
              type="number"
              min={ABSOLUTE_MIN_PRICE}
              max={filters.maxPrice}
              value={filters.minPrice}
              onChange={e => onChange({ ...filters, minPrice: Number(e.target.value) || ABSOLUTE_MIN_PRICE })}
              className="w-full pl-8 pr-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0089D0]"
            />
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-neutral-400">до</span>
            <input
              type="number"
              min={filters.minPrice}
              max={ABSOLUTE_MAX_PRICE}
              value={filters.maxPrice}
              onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) || ABSOLUTE_MAX_PRICE })}
              className="w-full pl-8 pr-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0089D0]"
            />
          </div>
        </div>

        {/* Двойной ползунок (Dual Range Slider) */}
        <div className="relative pt-3 pb-1">
          {/* Базовый трек */}
          <div className="h-1.5 w-full bg-neutral-200 rounded-full relative">
            {/* Активный диапазон между бегунками */}
            <div
              className="absolute top-0 bottom-0 bg-[#0089D0] rounded-full"
              style={{
                left: `${minPercent}%`,
                right: `${100 - maxPercent}%`,
              }}
            />
          </div>

          {/* Левый бегунок (Min) */}
          <input
            type="range"
            min={ABSOLUTE_MIN_PRICE}
            max={ABSOLUTE_MAX_PRICE}
            step={500}
            value={filters.minPrice}
            onChange={handleMinSlider}
            className="absolute top-1 left-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0089D0] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none cursor-pointer"
          />

          {/* Правый бегунок (Max) */}
          <input
            type="range"
            min={ABSOLUTE_MIN_PRICE}
            max={ABSOLUTE_MAX_PRICE}
            step={500}
            value={filters.maxPrice}
            onChange={handleMaxSlider}
            className="absolute top-1 left-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0089D0] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Расширенный блок "Кому" (Девочкам, Мальчикам, Малышам) */}
      <div className="space-y-2 pb-4 border-b border-neutral-200/70">
        <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">Кому</h4>
        <div className="space-y-1.5">
          {GENDERS.map(g => (
            <label key={g.id} className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={filters.gender === g.id}
                onChange={() => onChange({ ...filters, gender: filters.gender === g.id ? 'all' : g.id })}
                className="w-4 h-4 rounded border-neutral-300 text-[#0089D0] focus:ring-[#0089D0] cursor-pointer"
              />
              <span className="text-neutral-800 group-hover:text-neutral-900">
                {locale === 'kz' ? g.labelKz : g.labelRu}
              </span>
              <span className="text-neutral-400 text-xs">({g.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Расширенная линейка размеров (Взрослые + Дети) */}
      <div className="space-y-2.5 pb-4 border-b border-neutral-200/70">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">Размер</h4>
          {filters.size !== 'all' && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, size: 'all' })}
              className="text-[11px] text-[#0089D0] hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Быстрые вкладки: Все / Взрослые / Детские */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setSizeTab('all')}
            className={`py-1 rounded-md font-medium transition-colors ${
              sizeTab === 'all' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Все
          </button>
          <button
            type="button"
            onClick={() => setSizeTab('adult')}
            className={`py-1 rounded-md font-medium transition-colors ${
              sizeTab === 'adult' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Взрослые
          </button>
          <button
            type="button"
            onClick={() => setSizeTab('kids')}
            className={`py-1 rounded-md font-medium transition-colors ${
              sizeTab === 'kids' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Детские (рост)
          </button>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {displayedSizes.map(s => {
            const isChecked = filters.size === s.val;
            return (
              <label key={s.val} className="flex items-center gap-2 cursor-pointer select-none group py-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onChange({ ...filters, size: isChecked ? 'all' : s.val })}
                  className="w-4 h-4 rounded border-neutral-300 text-[#0089D0] focus:ring-[#0089D0] cursor-pointer"
                />
                <span className="text-neutral-800 group-hover:text-neutral-900 font-medium">
                  {s.label}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowAllSizes(!showAllSizes)}
          className="text-[#0089D0] hover:underline text-xs flex items-center gap-1 font-medium pt-1"
        >
          <span>{showAllSizes ? 'Свернуть' : `Показать все (${filteredSizes.length})`}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAllSizes ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 5. Богатая палитра цветов Kaspi (свыше 35 оттенков) */}
      <div className="space-y-2 pb-4 border-b border-neutral-200/70">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">Цвет</h4>
          {filters.color !== 'all' && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, color: 'all' })}
              className="text-[11px] text-[#0089D0] hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {displayedColors.map(c => {
            const isChecked = filters.color === c.id;
            return (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none group py-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onChange({ ...filters, color: isChecked ? 'all' : c.id })}
                  className="w-4 h-4 rounded border-neutral-300 text-[#0089D0] focus:ring-[#0089D0] cursor-pointer"
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.border ? 'border border-neutral-300' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-neutral-800 group-hover:text-neutral-900 capitalize">{c.label}</span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowAllColors(!showAllColors)}
          className="text-[#0089D0] hover:underline text-xs flex items-center gap-1 font-medium pt-1"
        >
          <span>{showAllColors ? 'Свернуть' : `Показать все цвета (${ALL_COLORS.length})`}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAllColors ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 6. Бренд / Фабрика */}
      <div className="space-y-2 pb-4 border-b border-neutral-200/70">
        <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">Бренд / Фабрика</h4>
        <div className="space-y-1.5">
          {BRANDS.map(b => {
            const isChecked = filters.brand === b.id;
            return (
              <label key={b.id} className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onChange({ ...filters, brand: isChecked ? 'all' : b.id })}
                  className="w-4 h-4 rounded border-neutral-300 text-[#0089D0] focus:ring-[#0089D0] cursor-pointer"
                />
                <span className="text-neutral-800 group-hover:text-neutral-900">{b.label}</span>
                <span className="text-neutral-400 text-xs">({b.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Наличие в филиале */}
      <div className="pt-1">
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={e => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-semibold text-neutral-900 block">Самовывоз сегодня</span>
            <span className="text-neutral-500">В наличии в {currentBranchName}</span>
          </div>
        </label>
      </div>
    </aside>
  );
}
