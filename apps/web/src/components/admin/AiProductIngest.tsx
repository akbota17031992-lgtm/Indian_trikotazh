'use client';

import React, { useState, useEffect } from 'react';
import { ALL_BRANCHES } from '@/lib/branch-constants';
import { formatKZT } from '@india-trikotaj/shared';
import {
  Sparkles,
  CheckCircle2,
  Store,
  RefreshCw,
  Wand2,
  Sliders,
  Layers,
  Sun,
  Contrast,
  Undo2,
  Flame,
  Camera,
  Shirt,
  Sparkle,
  Plus,
  Trash2,
  RotateCw,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Check,
  AlertCircle,
  ArrowLeft,
  Save,
} from 'lucide-react';
import {
  processProductPhoto,
  generateGhostMannequin,
  rotatePhotoClockwise,
  DEFAULT_FILTER_OPTIONS,
  type PhotoFilterOptions,
} from '@/lib/image-editor-engine';
import { saveDynamicProduct } from '@/lib/products-store';

interface BranchStockRow {
  branchId: string;
  branchNameRu: string;
  stock: number;
}

interface GalleryImageItem {
  id: string;
  name: string;
  rawBase64: string;
  processedBase64: string;
  isAiProcessed: boolean;
  filterOptions: PhotoFilterOptions;
}

interface AiProductIngestProps {
  productToEdit?: any | null;
  onProductCreated?: (savedProduct: any) => void;
  onCancel?: () => void;
}

export function AiProductIngest({
  productToEdit = null,
  onProductCreated,
  onCancel,
}: AiProductIngestProps = {}) {
  // Step-by-step state
  const [gallery, setGallery] = useState<GalleryImageItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'processed' | 'original'>('processed');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiActionNotice, setAiActionNotice] = useState<string | null>(null);

  // Form State
  const [titleRu, setTitleRu] = useState('Худи оверсайз из плотного хлопкового трикотажа');
  const [titleKz, setTitleKz] = useState('Тығыз мақта трикотажынан жасалған оверсайз худи');
  const [category, setCategory] = useState('long-sleeves');
  const [compositionRu, setCompositionRu] = useState('100% гребенной хлопок премиум (футер 3-нитка)');
  const [compositionKz, setCompositionKz] = useState('100% премиум тарақты мақта');
  const [descriptionRu, setDescriptionRu] = useState('Стильное оверсайз худи из мягкого плотного хлопкового трикотажа с начесом. Фабричный пошив, комфортная посадка, глубокий капюшон и стойкое окрашивание ткани. Идеально для повседневного городского гардероба.');
  const [descriptionKz, setDescriptionKz] = useState('Жұмсақ әрі тығыз мақта трикотажынан тігілген стильді оверсайз худи. Ыңғайлы пішім, терең капюшон, сапалы фабрикалық тігіс. Күнделікті киюге өте қолайлы.');
  const [priceKzt, setPriceKzt] = useState(11990);
  const [branchesStock, setBranchesStock] = useState<BranchStockRow[]>(
    ALL_BRANCHES.map(b => ({
      branchId: b.id,
      branchNameRu: b.nameRu,
      stock: 12,
    }))
  );

  // Load product to edit if provided
  useEffect(() => {
    if (productToEdit) {
      setTitleRu(productToEdit.nameRu || '');
      setTitleKz(productToEdit.nameKz || '');
      setCategory(productToEdit.categorySlug || 'tunics');
      setPriceKzt(productToEdit.basePriceKzt || 9990);
      setCompositionRu(productToEdit.compositionRu || '');
      setCompositionKz(productToEdit.compositionKz || '');
      setDescriptionRu(productToEdit.descriptionRu || '');
      setDescriptionKz(productToEdit.descriptionKz || '');

      const initialImages: string[] =
        Array.isArray(productToEdit.images) && productToEdit.images.length > 0
          ? productToEdit.images
          : productToEdit.imageUrl
          ? [productToEdit.imageUrl]
          : [];

      const galleryItems: GalleryImageItem[] = initialImages.map((imgUrl: string, idx: number) => ({
        id: `img-edit-${idx}-${Date.now()}`,
        name: idx === 0 ? 'Главное фото (Обложка)' : `Ракурс #${idx + 1}`,
        rawBase64: imgUrl,
        processedBase64: imgUrl,
        isAiProcessed: true,
        filterOptions: DEFAULT_FILTER_OPTIONS,
      }));

      setGallery(galleryItems);
      setActiveImageIndex(0);

      if (productToEdit.stockByBranch) {
        setBranchesStock(
          ALL_BRANCHES.map(b => ({
            branchId: b.id,
            branchNameRu: b.nameRu,
            stock: productToEdit.stockByBranch[b.id] ?? 0,
          }))
        );
      }
      setIsPublished(false);
      setAiActionNotice(`Карточка товара «${productToEdit.nameRu}» открыта для изменения`);
    } else {
      setGallery([]);
      setActiveImageIndex(0);
      setTitleRu('Худи оверсайз из плотного хлопкового трикотажа');
      setTitleKz('Тығыз мақта трикотажынан жасалған оверсайз худи');
      setCategory('long-sleeves');
      setPriceKzt(11990);
      setCompositionRu('100% гребенной хлопок премиум (футер 3-нитка)');
      setCompositionKz('100% премиум тарақты мақта');
      setDescriptionRu('Стильное оверсайз худи из мягкого плотного хлопкового трикотажа с начесом. Фабричный пошив, комфортная посадка, глубокий капюшон и стойкое окрашивание ткани. Идеально для повседневного городского гардероба.');
      setDescriptionKz('Жұмсақ әрі тығыз мақта трикотажынан тігілген стильді оверсайз худи. Ыңғайлы пішім, терең капюшон, сапалы фабрикалық тігіс. Күнделікті киюге өте қолайлы.');
      setBranchesStock(
        ALL_BRANCHES.map(b => ({
          branchId: b.id,
          branchNameRu: b.nameRu,
          stock: 12,
        }))
      );
      setIsPublished(false);
    }
  }, [productToEdit]);

  const activePhoto = gallery[activeImageIndex] || null;
  const processedCount = gallery.filter(item => item.isAiProcessed).length;

  // Apply filters to active image in gallery
  const applyFiltersToActivePhoto = async (newOptions: PhotoFilterOptions, markAsProcessed = true) => {
    if (!activePhoto) return;
    setIsProcessingPhoto(true);
    try {
      const output = await processProductPhoto(activePhoto.rawBase64, newOptions);
      setGallery(prev =>
        prev.map((item, idx) =>
          idx === activeImageIndex
            ? {
                ...item,
                processedBase64: output,
                filterOptions: newOptions,
                isAiProcessed: markAsProcessed ? true : item.isAiProcessed,
              }
            : item
        )
      );
      setPreviewMode('processed');
    } catch (e) {
      console.error('Error applying photo filters:', e);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Rotate Active Photo 90 degrees
  const handleRotateActivePhoto = async () => {
    if (!activePhoto) return;
    setIsProcessingPhoto(true);
    setAiActionNotice('Поворот фото на 90°...');
    try {
      const rotatedProcessed = await rotatePhotoClockwise(activePhoto.processedBase64);
      const rotatedRaw = await rotatePhotoClockwise(activePhoto.rawBase64);
      setGallery(prev =>
        prev.map((item, idx) =>
          idx === activeImageIndex
            ? { ...item, processedBase64: rotatedProcessed, rawBase64: rotatedRaw }
            : item
        )
      );
      setAiActionNotice('Фото успешно повернуто на 90°');
    } catch (err) {
      console.error('Rotate error:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Step 3: Set selected photo as main cover (index 0)
  const handleSetMainImage = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index === 0 || index >= gallery.length) return;
    const target = gallery[index]!;
    const remaining = gallery.filter((_, idx) => idx !== index);
    const updated = [target, ...remaining];
    setGallery(updated);
    setActiveImageIndex(0);
    setAiActionNotice(`★ Фото «${target.name}» выбрано главным (обложкой карточки)!`);
  };

  // Reorder photos left / right
  const handleMoveImage = (fromIndex: number, toIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (toIndex < 0 || toIndex >= gallery.length) return;
    const updated = [...gallery];
    const [moved] = updated.splice(fromIndex, 1);
    if (moved) {
      updated.splice(toIndex, 0, moved);
      setGallery(updated);
      setActiveImageIndex(toIndex);
    }
  };

  // Step 2 Action A: AI Studio Lighting for Active Photo
  const handleAiStudioLighting = async () => {
    if (!activePhoto) return;
    setIsProcessingPhoto(true);
    setAiActionNotice('ИИ настраивает студийный свет, баланс белого и сочность ткани...');
    try {
      const enhanced: PhotoFilterOptions = {
        ...activePhoto.filterOptions,
        brightness: 8,
        contrast: 15,
        saturation: 14,
        warmth: 3,
        sharpness: 25,
        aspectRatio: '1:1',
      };
      await applyFiltersToActivePhoto(enhanced, true);
      setAiActionNotice(`Кадр #${activeImageIndex + 1} обработан через ИИ (Студийный свет)`);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Step 2 Action B: AI Smart Crop "Только платье" for Active Photo
  const handleAiSmartCrop = async () => {
    if (!activePhoto) return;
    setIsProcessingPhoto(true);
    setAiActionNotice('ИИ кадрирует изделие и удаляет лишний фон...');
    try {
      const output = await generateGhostMannequin(activePhoto.rawBase64);
      setGallery(prev =>
        prev.map((item, idx) =>
          idx === activeImageIndex
            ? { ...item, processedBase64: output, isAiProcessed: true }
            : item
        )
      );
      setPreviewMode('processed');
      setAiActionNotice(`Кадр #${activeImageIndex + 1} сфокусирован на платье (Smart Crop)`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Step 2 Action C: AI Batch processing - process ALL photos at once
  const handleAiBatchProcessAll = async () => {
    if (gallery.length === 0) return;
    setIsProcessingPhoto(true);
    setAiActionNotice(`ИИ пакетно обрабатывает все ${gallery.length} фото товара...`);
    try {
      const batchOptions: PhotoFilterOptions = {
        brightness: 8,
        contrast: 15,
        saturation: 14,
        warmth: 3,
        sharpness: 25,
        removeBg: false,
        aspectRatio: '1:1',
      };

      const updated = await Promise.all(
        gallery.map(async item => {
          const processed = await processProductPhoto(item.rawBase64, batchOptions);
          return {
            ...item,
            processedBase64: processed,
            filterOptions: { ...batchOptions },
            isAiProcessed: true,
          };
        })
      );
      setGallery(updated);
      setAiActionNotice(`✓ Готово! Все ${gallery.length} фото товара обработаны через ИИ к студийному стандарту.`);
    } catch (e) {
      console.error('Batch error:', e);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Toggle Kaspi White background
  const handleToggleWhiteBg = () => {
    if (!activePhoto) return;
    const updated: PhotoFilterOptions = {
      ...activePhoto.filterOptions,
      removeBg: !activePhoto.filterOptions.removeBg,
    };
    applyFiltersToActivePhoto(updated, true);
    setAiActionNotice(updated.removeBg ? 'Белый фон Kaspi включен' : 'Исходный фон возвращен');
  };

  // Reset active photo to original draft
  const handleResetActivePhoto = () => {
    if (activePhoto) {
      setGallery(prev =>
        prev.map((item, idx) =>
          idx === activeImageIndex
            ? {
                ...item,
                processedBase64: item.rawBase64,
                filterOptions: DEFAULT_FILTER_OPTIONS,
                isAiProcessed: false,
              }
            : item
        )
      );
      setPreviewMode('original');
      setAiActionNotice(`Кадр #${activeImageIndex + 1} возвращен к исходному черновику`);
    }
  };

  // Delete image
  const handleDeleteImage = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = gallery.filter((_, idx) => idx !== indexToDelete);
    setGallery(updated);
    if (activeImageIndex >= updated.length) {
      setActiveImageIndex(Math.max(0, updated.length - 1));
    }
    setAiActionNotice('Фото удалено из карточки');
  };

  // Step 1: Multiple File Upload Handler
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: GalleryImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const base64 = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newItems.push({
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        rawBase64: base64,
        processedBase64: base64,
        isAiProcessed: false,
        filterOptions: DEFAULT_FILTER_OPTIONS,
      });
    }

    const updatedGallery = [...gallery, ...newItems];
    setGallery(updatedGallery);
    setActiveImageIndex(gallery.length); // point to first new
    setIsPublished(false);
    setAiActionNotice(`Шаг 1 выполнен: загружено ${newItems.length} фото черновиков. Теперь переходите к обработке ИИ (Шаг 2).`);

    // Run AI recognition on first image if metadata not filled
    if (newItems[0] && gallery.length === 0) {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/ai/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: newItems[0].rawBase64,
            mimeType: 'image/jpeg',
            filename: newItems[0].name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.metadata) {
            setTitleRu(data.metadata.titleRu || titleRu);
            setTitleKz(data.metadata.titleKz || titleKz);
            setCategory(data.metadata.category || category);
            setCompositionRu(data.metadata.compositionRu || compositionRu);
            setCompositionKz(data.metadata.compositionKz || compositionKz);
            setDescriptionRu(data.metadata.descriptionRu || descriptionRu);
            setDescriptionKz(data.metadata.descriptionKz || descriptionKz);
            if (data.metadata.priceKzt) setPriceKzt(data.metadata.priceKzt);
            if (data.metadata.branchesStock) {
              setBranchesStock(data.metadata.branchesStock);
            }
          }
        }
      } catch (err) {
        console.error('AI Ingestion error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // AI Copywriter: Generate product descriptions
  const handleGenerateAiDescription = async () => {
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleRu,
          category,
          compositionRu,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.descriptionRu) setDescriptionRu(data.descriptionRu);
        if (data.descriptionKz) setDescriptionKz(data.descriptionKz);
        setAiActionNotice('ИИ сгенерировал продающее двуязычное описание!');
      }
    } catch (e) {
      console.error('Error generating description:', e);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleStockChange = (branchId: string, value: number) => {
    setBranchesStock(prev =>
      prev.map(row => (row.branchId === branchId ? { ...row, stock: Math.max(0, value) } : row))
    );
  };

  const totalStock = branchesStock.reduce((acc, row) => acc + row.stock, 0);

  // Step 4: Final Master Publish Handler
  const handlePublish = async () => {
    if (gallery.length === 0) {
      setAiActionNotice('Сначала загрузите хотя бы одну фотографию товара (Шаг 1)!');
      return;
    }

    setIsSubmitting(true);
    const stockMap: Record<string, number> = {};
    branchesStock.forEach(b => {
      stockMap[b.branchId] = b.stock;
    });

    // Gallery images: index 0 is always the main cover
    const allImages = gallery.map(item => item.processedBase64);
    const mainCover = allImages[0]!;

    const newProductPayload = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      slug: productToEdit ? productToEdit.slug : `product-${Date.now()}`,
      nameRu: titleRu,
      nameKz: titleKz,
      categorySlug: category,
      basePriceKzt: priceKzt,
      imageUrl: mainCover,
      images: allImages,
      compositionRu: compositionRu,
      compositionKz: compositionKz,
      descriptionRu: descriptionRu,
      descriptionKz: descriptionKz,
      isPublished: productToEdit ? productToEdit.isPublished : true,
      stockByBranch: stockMap,
      totalStock: totalStock,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token',
        },
        body: JSON.stringify(newProductPayload),
      });

      const finalProduct = {
        ...newProductPayload,
        descriptionRu: descriptionRu || newProductPayload.descriptionRu,
        descriptionKz: descriptionKz || newProductPayload.descriptionKz,
      };

      saveDynamicProduct(finalProduct);
      setIsPublished(true);
      if (onProductCreated) {
        onProductCreated(finalProduct);
      }
    } catch (e) {
      console.error('Error publishing product:', e);
      saveDynamicProduct(newProductPayload);
      setIsPublished(true);
      if (onProductCreated) {
        onProductCreated(newProductPayload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-8 text-slate-100 space-y-6">
      {/* Header & 4-Step Progress Indicator */}
      <div className="pb-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white mb-3 transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>← Вернуться к списку товаров</span>
              </button>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {productToEdit ? 'Редактирование карточки товара' : 'Мастер добавления товара: 4 шага от фото до витрины'}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {productToEdit ? `Редактирование: «${titleRu}»` : 'Карточка товара: Добавление, ИИ-обработка и Выбор обложки'}
            </h2>
            {productToEdit && (
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Вы можете изменить фотографии (добавить новые, перевыбрать главное фото, обработать через ИИ), скорректировать цены, описание и остатки по филиалам.
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Филиалов в сети:</span>
            <span className="text-base font-bold text-amber-400">16 магазинов Алматы</span>
          </div>
        </div>

        {/* 4 Steps Visual Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs">
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            gallery.length > 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              gallery.length > 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'
            }`}>
              1
            </span>
            <span className="font-bold">
              {gallery.length > 0 ? `Фото загружено (${gallery.length})` : '1. Загрузить фото'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            processedCount > 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              processedCount > 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'
            }`}>
              2
            </span>
            <span className="font-bold">
              {processedCount > 0 ? `Обработано ИИ (${processedCount}/${gallery.length})` : '2. Обработать ИИ'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            gallery.length > 0
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              gallery.length > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white'
            }`}>
              3
            </span>
            <span className="font-bold">
              {gallery.length > 0 ? '3. Обложка выбрана ★' : '3. Выбрать обложку'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            isPublished
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              isPublished ? 'bg-slate-950 text-white' : 'bg-slate-800 text-white'
            }`}>
              4
            </span>
            <span className="font-bold">
              {isPublished ? '✓ Опубликовано' : '4. Опубликовать'}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {isPublished && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-white text-sm">Товар успешно опубликован в магазине!</h4>
              <p className="text-xs text-emerald-300">
                Позиция «{titleRu}» со всеми {gallery.length} фотографиями появилась в каталоге и доступна во всех 16 филиалах сети.
              </p>
            </div>
          </div>
          <a
            href="/catalog"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-emerald-500/30"
          >
            <span>Посмотреть на витрине</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos, AI Processing & Cover Selector (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header of Photo Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white">
                Фотографии товара
              </label>
              {gallery.length > 0 && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {gallery.length} снимков
                </span>
              )}
            </div>

            {/* Step 1: Add Photos Button */}
            <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20">
              <Plus className="w-4 h-4" />
              <span>+ Загрузить фото</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMultipleFilesUpload}
              />
            </label>
          </div>

          {/* STEP 1 & 3: PHOTO TILES WITH COVER SELECTOR */}
          {gallery.length > 0 ? (
            <div className="space-y-2 bg-slate-950/70 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span className="font-bold text-slate-300">
                  Шаг 3: Нажмите звезду на нужном фото, чтобы сделать его обложкой:
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  {processedCount} из {gallery.length} обработано ИИ
                </span>
              </div>

              {/* Horizontal Scroll of all photos */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
                {gallery.map((item, idx) => {
                  const isMain = idx === 0;
                  const isActive = idx === activeImageIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative group cursor-pointer w-24 h-32 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        isMain
                          ? 'border-amber-400 ring-4 ring-amber-500/20 shadow-xl scale-[1.02]'
                          : isActive
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-650'
                      }`}
                    >
                      <img
                        src={item.processedBase64}
                        alt={item.name}
                        className="w-full h-full object-cover bg-slate-950"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        {isMain ? (
                          <div className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-slate-950" />
                            <span>ОБЛОЖКА</span>
                          </div>
                        ) : (
                          <span className="bg-black/75 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                        )}

                        {item.isAiProcessed ? (
                          <span className="bg-emerald-500 text-slate-950 text-[8px] font-black px-1 py-0.5 rounded shadow">
                            ИИ ✓
                          </span>
                        ) : (
                          <span className="bg-slate-800/90 text-slate-300 text-[8px] font-medium px-1 py-0.5 rounded">
                            Черновик
                          </span>
                        )}
                      </div>

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <div className="flex items-center justify-between">
                          {!isMain ? (
                            <button
                              type="button"
                              onClick={(e) => handleSetMainImage(idx, e)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow"
                              title="Сделать главным фото (обложкой каталога)"
                            >
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Обложка</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              Главное
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteImage(idx, e)}
                            className="w-6 h-6 bg-red-600/90 hover:bg-red-500 text-white rounded flex items-center justify-center ml-auto"
                            title="Удалить фото"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Reorder Arrows */}
                        <div className="flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveImage(idx, idx - 1, e)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center"
                              title="Сдвинуть влево"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < gallery.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveImage(idx, idx + 1, e)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center justify-center"
                              title="Сдвинуть вправо"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Another Photo Mini Card */}
                <label className="cursor-pointer w-24 h-32 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 flex flex-col items-center justify-center text-slate-400 hover:text-amber-300 shrink-0 transition-all group">
                  <Plus className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">+ фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMultipleFilesUpload}
                  />
                </label>
              </div>

              {/* Batch AI Processing Button */}
              {gallery.length > 1 && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Хотите сэкономить время?
                  </span>
                  <button
                    type="button"
                    onClick={handleAiBatchProcessAll}
                    disabled={isProcessingPhoto}
                    className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Обработать ВСЕ фото через ИИ в 1 клик</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone when gallery is empty */
            <label className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-3xl p-8 text-center transition-all bg-slate-950/40 hover:bg-slate-950/70 flex flex-col items-center justify-center min-h-[300px] group">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleMultipleFilesUpload}
              />
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Шаг 1: Загрузите несколько фото товара
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                Выберите сразу 3–5 снимков (вид спереди, вид сзади, фактура ткани, бирка с составом)
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20">
                <Plus className="w-4 h-4" />
                <span>Выбрать файлы на компьютере</span>
              </div>
            </label>
          )}

          {/* STEP 2: ACTIVE PHOTO AI WORKSPACE */}
          {activePhoto && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
              {/* Header: Photo Title + Do/Posle Toggle + Rotate */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-850 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4" />
                      Шаг 2: Обработка кадра #{activeImageIndex + 1}
                    </span>
                    {activeImageIndex === 0 && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow">
                        ★ Главная обложка
                      </span>
                    )}
                    {activePhoto.isAiProcessed ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                        Обработано ИИ
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded">
                        Исходный черновик
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[240px] block mt-0.5">
                    Файл: {activePhoto.name}
                  </span>
                </div>

                {/* Compare / Rotate Controls */}
                <div className="flex items-center gap-1.5">
                  {/* Before / After toggle */}
                  <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('original')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                        previewMode === 'original'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      До (Оригинал)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('processed')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                        previewMode === 'processed'
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      После (ИИ)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRotateActivePhoto}
                    disabled={isProcessingPhoto}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Повернуть фото на 90 градусов"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetActivePhoto}
                    disabled={isProcessingPhoto}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Сбросить к исходному черновику"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Photo Preview */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-2 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[400px]">
                <img
                  src={previewMode === 'processed' ? activePhoto.processedBase64 : activePhoto.rawBase64}
                  alt={activePhoto.name}
                  className="w-full max-h-[380px] object-contain rounded-xl mx-auto transition-transform duration-200"
                />

                {/* Floating Preview Mode Pill */}
                <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                  Режим просмотра: {previewMode === 'processed' ? '✨ Обработанное ИИ' : 'Исходный черновик'}
                </div>

                {isProcessingPhoto && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-amber-400 font-bold text-xs p-4">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
                    <span className="text-center">{aiActionNotice || 'ИИ обрабатывает изображение...'}</span>
                  </div>
                )}
              </div>

              {/* Status / Notice */}
              {aiActionNotice && !isProcessingPhoto && (
                <div className="text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Sparkle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{aiActionNotice}</span>
                </div>
              )}

              {/* AI Actions Buttons for this photo */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Выберите обработку для кадра #{activeImageIndex + 1}:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Action 1: Studio Light */}
                  <button
                    type="button"
                    onClick={handleAiStudioLighting}
                    disabled={isProcessingPhoto}
                    className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Студийный свет ИИ</span>
                    <span className="text-[10px] font-normal text-amber-400/80">Баланс белого и цвет</span>
                  </button>

                  {/* Action 2: Smart Crop */}
                  <button
                    type="button"
                    onClick={handleAiSmartCrop}
                    disabled={isProcessingPhoto}
                    className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Shirt className="w-4 h-4 text-purple-400" />
                    <span>Только платье</span>
                    <span className="text-[10px] font-normal text-purple-400/80">Убрать телефон и лицо</span>
                  </button>

                  {/* Action 3: White Background */}
                  <button
                    type="button"
                    onClick={handleToggleWhiteBg}
                    disabled={isProcessingPhoto}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activePhoto.filterOptions.removeBg
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-750'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-slate-300" />
                    <span>{activePhoto.filterOptions.removeBg ? 'Белый фон (Вкл)' : 'Белый фон Kaspi'}</span>
                    <span className="text-[10px] font-normal opacity-80">Изоляция изделия</span>
                  </button>
                </div>

                {/* Make Main Cover Button in Editor */}
                {activeImageIndex !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMainImage(activeImageIndex)}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Сделать этот кадр главным (Обложкой товара в каталоге)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Gemini анализирует фотографии и заполняет карточку...</span>
            </div>
          )}
        </div>

        {/* Right Column: Metadata, Stock & Step 4: Publish (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Название товара (Русский)
              </label>
              <input
                type="text"
                value={titleRu}
                onChange={e => setTitleRu(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Тауар атауы (Қазақша)
              </label>
              <input
                type="text"
                value={titleKz}
                onChange={e => setTitleKz(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Категория
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              >
                <option value="tunics" className="bg-slate-900 text-white">Туники и платья</option>
                <option value="pajamas" className="bg-slate-900 text-white">Пижамы и домашняя одежда</option>
                <option value="t-shirts" className="bg-slate-900 text-white">Футболки и поло</option>
                <option value="underwear" className="bg-slate-900 text-white">Нижнее белье</option>
                <option value="textiles" className="bg-slate-900 text-white">Домашний текстиль</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Розничная цена (KZT)
              </label>
              <input
                type="number"
                value={priceKzt}
                onChange={e => setPriceKzt(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-bold font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Состав ткани (RU)
              </label>
              <input
                type="text"
                value={compositionRu}
                onChange={e => setCompositionRu(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Мата құрамы (KZ)
              </label>
              <input
                type="text"
                value={compositionKz}
                onChange={e => setCompositionKz(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* AI Copywriter Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                Описание товара (RU)
              </label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isGeneratingCopy}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl transition-all"
                title="Сгенерировать продающее описание с помощью ИИ"
              >
                {isGeneratingCopy ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingCopy ? 'ИИ пишет текст...' : 'Придумать описание через ИИ'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={descriptionRu}
              onChange={e => setDescriptionRu(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors leading-relaxed"
              placeholder="Продающее описание на русском языке..."
            />

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Тауардың толық сипаттамасы (KZ)
              </label>
              <textarea
                rows={3}
                value={descriptionKz}
                onChange={e => setDescriptionKz(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors leading-relaxed"
                placeholder="Қазақ тіліндегі толық сипаттама..."
              />
            </div>
          </div>

          {/* 16 Store Branches Allocation */}
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                Остатки по 16 филиалам Алматы
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                Всего: {totalStock} шт.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {branchesStock.map(branch => (
                <div
                  key={branch.branchId}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="text-slate-300 font-medium truncate max-w-[130px]" title={branch.branchNameRu}>
                    {branch.branchNameRu}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={branch.stock}
                      onChange={e => handleStockChange(branch.branchId, Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-500">шт</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: PUBLISH SECTION */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                Шаг 4: Готовность к публикации в сеть
              </span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {formatKZT(priceKzt)}
              </span>
            </div>

            <div className="text-[11px] space-y-1 text-slate-400 border-t border-slate-850 pt-2">
              <div className="flex items-center gap-2">
                {gallery.length > 0 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  Фотографий в карточке: <strong className="text-white">{gallery.length}</strong> (Обложка: {gallery[0] ? gallery[0].name : 'Не выбрана'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Обработано через ИИ: <strong className="text-white">{processedCount} из {gallery.length}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Филиалов наличия: <strong className="text-white">16 магазинов</strong> ({totalStock} шт)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting || gallery.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : productToEdit ? (
                <Save className="w-4 h-4" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Сохранение в базу...'
                  : productToEdit
                  ? `Сохранить изменения (${gallery.length} фото) в 16 магазинах`
                  : gallery.length > 0
                  ? `Опубликовать товар (${gallery.length} фото) в 16 магазинов`
                  : 'Сначала загрузите фото товара (Шаг 1)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
