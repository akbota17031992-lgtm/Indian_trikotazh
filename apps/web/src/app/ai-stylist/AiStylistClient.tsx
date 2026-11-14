'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, Upload, Sparkles, CheckCircle, RefreshCw, ShoppingBag, 
  ArrowLeft, MapPin, Tag, ShieldCheck, Heart, Share2, Layers, AlertCircle
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@india-trikotaj/ui';
import { formatKZT } from '@india-trikotaj/shared';
import { useLocale } from '@/contexts/LocaleContext';
import { useBranch } from '@/contexts/BranchContext';
import { useCart } from '@/contexts/CartContext';
import type { StylistAnalysisResult } from '../api/ai/stylist/route';

const DEMO_AVATARS = [
  {
    id: 'warm-autumn' as const,
    titleRu: 'Тёплая Осень',
    titleKz: 'Жылы Күз',
    descRu: 'Каштановые волосы, теплый подтон',
    descKz: 'Қоңыр шаш, жылы реңк',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    colorHex: '#C85A32',
  },
  {
    id: 'cool-winter' as const,
    titleRu: 'Контрастная Зима',
    titleKz: 'Айқын Қыс',
    descRu: 'Темные волосы, контрастные черты',
    descKz: 'Қара шаш, айқын келбет',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    colorHex: '#1F3A93',
  },
  {
    id: 'soft-summer' as const,
    titleRu: 'Нежное Лето',
    titleKz: 'Нәзік Жаз',
    descRu: 'Русые волосы, мягкий взгляд',
    descKz: 'Қоңырқай шаш, нәзік көздер',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    colorHex: '#5E8C7A',
  },
  {
    id: 'bright-spring' as const,
    titleRu: 'Сияющая Весна',
    titleKz: 'Жарқын Көктем',
    descRu: 'Светлые золотистые волосы',
    descKz: 'Алтын түстес ашық шаш',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    colorHex: '#E76F51',
  },
];

export function AiStylistClient() {
  const { locale } = useLocale();
  const { selectedBranch } = useBranch();
  const { addItem } = useCart();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<StylistAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when component unmounts or camera is deactivated
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Не удалось получить доступ к веб-камере. Пожалуйста, разрешите доступ в браузере или загрузите фото из файла.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setSelectedImage(dataUrl);
      runStylistAnalysis({ imageBase64: dataUrl });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Пожалуйста, выберите файл изображения (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      runStylistAnalysis({ imageBase64: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDemoSelect = (avatar: typeof DEMO_AVATARS[0]) => {
    setSelectedImage(avatar.imageUrl);
    runStylistAnalysis({ demoProfileId: avatar.id });
  };

  const runStylistAnalysis = async (payload: { imageBase64?: string; demoProfileId?: any }) => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setErrorMsg(null);
    setResult(null);
    setAddedSuccess(false);

    // Visual scan steps progression
    const timer1 = setTimeout(() => setAnalysisStep(2), 700);
    const timer2 = setTimeout(() => setAnalysisStep(3), 1400);

    try {
      const res = await fetch('/api/ai/stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          selectedBranchId: selectedBranch.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ошибка при анализе стиля');
      }

      const data: StylistAnalysisResult = await res.json();
      setTimeout(() => {
        setResult(data);
        setIsAnalyzing(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Сбой соединения. Попробуйте еще раз.');
      setIsAnalyzing(false);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  };

  const resetAll = () => {
    stopCamera();
    setSelectedImage(null);
    setResult(null);
    setIsAnalyzing(false);
    setErrorMsg(null);
    setAddedSuccess(false);
  };

  const handleAddBundleToCart = () => {
    if (!result) return;
    result.matchedProducts.forEach(item => {
      const defaultVariant = item.product.variants[0];
      addItem(
        {
          variantId: defaultVariant.id,
          productId: item.product.id,
          titleRu: item.product.nameRu,
          titleKz: item.product.nameKz,
          sku: defaultVariant.sku,
          size: defaultVariant.size,
          colorRu: defaultVariant.colorRu,
          colorKz: defaultVariant.colorKz,
          colorHex: defaultVariant.colorHex,
          priceKzt: defaultVariant.priceKzt,
          imageUrl: item.product.imageUrl,
        },
        1
      );
    });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 4000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Top Breadcrumb & Title */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'kz' ? 'Басты бетке оралу' : 'На главную'}</span>
        </Link>
        <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-900 font-semibold px-3 py-1 gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{locale === 'kz' ? 'ЖИ-Стилист 2026' : 'AI Fashion Stylist 2026'}</span>
        </Badge>
      </div>

      {/* Main Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          {locale === 'kz' ? 'Фото бойынша ЖИ-Стилист' : 'Персональный ИИ-Стилист по фото'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {locale === 'kz' 
            ? 'Камераны бағыттаңыз немесе фотоңызды жүктеңіз: нейрожелі сіздің түс сәйкестігіңізді анықтап, Алматыдағы 16 филиал қоймасынан мінсіз үнді трикотажы образын жинайды.'
            : 'Наведите камеру или загрузите фото: нейросеть определит ваш цветотип внешности и подберёт идеальный комплект индийского трикотажа из наличия в 16 филиалах Алматы.'}
        </p>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STAGE 1: Photo input / Camera / Quick Demo */}
      {!selectedImage && !isAnalyzing && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Capture Card */}
            <Card className="border-2 border-dashed border-border hover:border-amber-500/70 transition-all bg-card/60 backdrop-blur">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[260px]">
                {isCameraActive ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-black mb-4 border-2 border-amber-500">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={capturePhoto} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
                        <Camera className="w-4 h-4" />
                        <span>Сделать снимок</span>
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">Сделать фото через камеру</h3>
                    <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                      Включите камеру смартфона или ноутбука для мгновенного сканирования лица и цветотипа
                    </p>
                    <Button onClick={startCamera} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Включить камеру</span>
                    </Button>
                  </>
                )}
                {cameraError && (
                  <p className="mt-3 text-xs text-red-600">{cameraError}</p>
                )}
              </CardContent>
            </Card>

            {/* Gallery File Upload Card */}
            <Card className="border-2 border-dashed border-border hover:border-emerald-500/70 transition-all bg-card/60 backdrop-blur">
              <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[260px]">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-1">Загрузить фото из файла</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                  Загрузите своё селфи или фото в полный рост (JPG, PNG до 10 МБ)
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Выбрать фото из галереи</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Demo Avatars Selector */}
          <div className="bg-muted/40 rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-foreground">
                {locale === 'kz' ? 'Дайын үлгілерді сынап көру (1 секунд):' : 'Попробовать на готовых типажах (Демо в 1 клик):'}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEMO_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => handleDemoSelect(avatar)}
                  className="group relative flex flex-col items-center p-3 rounded-xl border border-border bg-card hover:border-amber-500 hover:shadow-md transition-all text-left"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-2.5 border-2 border-border group-hover:border-amber-500 transition-colors relative">
                    <Image 
                      src={avatar.imageUrl} 
                      alt={avatar.titleRu} 
                      fill 
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-amber-700 transition-colors text-center line-clamp-1">
                    {locale === 'kz' ? avatar.titleKz : avatar.titleRu}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center line-clamp-1">
                    {locale === 'kz' ? avatar.descKz : avatar.descRu}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: AI Analyzing animation */}
      {isAnalyzing && (
        <Card className="border border-border bg-card shadow-lg p-8 max-w-lg mx-auto text-center">
          <CardContent className="p-0 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-6 border-4 border-amber-500/80 shadow-inner">
              {selectedImage && (
                <Image src={selectedImage} alt="User image" fill sizes="128px" className="object-cover" />
              )}
              {/* Laser scan line effect */}
              <div className="absolute inset-x-0 h-1 bg-amber-400 shadow-[0_0_12px_#F59E0B] animate-bounce" />
            </div>

            <div className="w-8 h-8 rounded-full border-3 border-amber-600 border-t-transparent animate-spin mb-4" />
            
            <h3 className="text-lg font-bold mb-2">
              {analysisStep === 1 && 'Анализируем подтон кожи и цвет глаз...'}
              {analysisStep === 2 && 'Определяем гармоничную палитру оттенков...'}
              {analysisStep === 3 && 'Ищем наличие в 16 филиалах сети...'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              ИИ-стилист сканирует каталог индийского трикотажа для подбора идеального образа.
            </p>
          </CardContent>
        </Card>
      )}

      {/* STAGE 3: Result Display */}
      {result && !isAnalyzing && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Analysis Verdict Banner */}
          <Card className="border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* User photo thumbnail */}
                {selectedImage && (
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-400 shadow-sm">
                    <Image src={selectedImage} alt="Uploaded look" fill sizes="144px" className="object-cover" />
                    <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white rounded-full p-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Analysis Breakdown */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                      {locale === 'kz' ? result.colorType.nameKz : result.colorType.nameRu}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{selectedBranch.nameRu}</span>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {locale === 'kz' ? result.colorType.descriptionKz : result.colorType.descriptionRu}
                  </p>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === 'kz' ? result.stylistVerdictKz : result.stylistVerdictRu}
                  </p>

                  {/* Complementary Colors Palette */}
                  <div className="pt-2 border-t border-amber-200/60">
                    <span className="text-xs font-bold text-foreground block mb-2">
                      {locale === 'kz' ? 'Ұсынылатын түстер палитрасы:' : 'Ваша гармоничная палитра оттенков:'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {result.colorType.palette.map(color => (
                        <div 
                          key={color.hex} 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-white shadow-xs"
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[11px] font-medium text-foreground">
                            {locale === 'kz' ? color.nameKz : color.nameRu}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Look Capsule */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span>{locale === 'kz' ? result.lookTitleKz : result.lookTitleRu}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {locale === 'kz' ? result.silhouetteAdvice.cutAdviceKz : result.silhouetteAdvice.cutAdviceRu}
                </p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAll} 
                className="self-start sm:self-auto gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{locale === 'kz' ? 'Басқа фото жүктеу' : 'Загрузить другое фото'}</span>
              </Button>
            </div>

            {/* Matched Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {result.matchedProducts.map((item, idx) => (
                <Card key={item.product.id} className="border border-border overflow-hidden hover:border-amber-400 transition-colors">
                  <CardContent className="p-4 flex gap-4">
                    {/* Product Image */}
                    <div className="relative w-28 h-36 rounded-xl overflow-hidden bg-muted shrink-0">
                      <Image 
                        src={item.product.imageUrl} 
                        alt={item.product.nameRu} 
                        fill 
                        sizes="112px"
                        className="object-cover" 
                      />
                      <Badge className="absolute top-1 left-1 bg-black/60 text-white text-[10px] py-0 px-1.5">
                        {item.role === 'main' ? 'Главная вещь' : 'Компаньон'}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-0.5">
                          {item.product.materialRu}
                        </span>
                        <Link 
                          href={`/products/${item.product.slug}`}
                          className="font-bold text-sm text-foreground hover:text-amber-700 transition-colors line-clamp-2 mb-1"
                        >
                          {locale === 'kz' ? item.product.nameKz : item.product.nameRu}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {locale === 'kz' ? item.reasonKz : item.reasonRu}
                        </p>
                      </div>

                      <div>
                        {/* Store Availability Badge */}
                        <div className="flex items-center gap-1.5 text-xs mb-2">
                          <span className={`w-2 h-2 rounded-full ${item.inSelectedBranch ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className={item.inSelectedBranch ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                            {item.inSelectedBranch 
                              ? `В наличии в ${selectedBranch.nameRu}` 
                              : `Доступно в ${item.availableBranchesCount} филиалах сети`}
                          </span>
                        </div>

                        {/* Price & Single Add */}
                        <div className="flex items-center justify-between">
                          <span className="text-base font-extrabold text-foreground">
                            {formatKZT(item.product.basePriceKzt)}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const v = item.product.variants[0];
                              addItem(
                                {
                                  variantId: v.id,
                                  productId: item.product.id,
                                  titleRu: item.product.nameRu,
                                  titleKz: item.product.nameKz,
                                  sku: v.sku,
                                  size: v.size,
                                  colorRu: v.colorRu,
                                  colorKz: v.colorKz,
                                  colorHex: v.colorHex,
                                  priceKzt: v.priceKzt,
                                  imageUrl: item.product.imageUrl,
                                },
                                1
                              );
                            }}
                            className="h-8 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                          >
                            + В корзину
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Buy Bundle Action Box */}
            <Card className="border-2 border-emerald-500/60 bg-emerald-50/40 p-5 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                      Скидка 5% на готовый образ
                    </span>
                    <span className="text-xs line-through text-muted-foreground">
                      {formatKZT(result.totalLookPriceKzt)}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {formatKZT(result.discountedPriceKzt)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Все позиции из комплекта сразу добавятся в вашу корзину
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    onClick={handleAddBundleToCart}
                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-5 text-sm rounded-xl gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{addedSuccess ? 'Образ добавлен в корзину!' : 'Купить весь образ (1 клик)'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
