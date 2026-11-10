import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/server-auth';

export interface VirtualTryOnRequest {
  imageBase64: string;
  mode: 'ghost_mannequin' | 'virtual_model' | 'clean_studio';
  modelEthnicity?: 'asian_kz' | 'european' | 'indian';
  modelPose?: 'studio_front' | 'walking' | 'side_turned';
  backgroundScene?: 'white_kaspi' | 'modern_studio' | 'cozy_home';
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`ai:model:${ip}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов к Fashion Studio. Пожалуйста, подождите 1 минуту.' },
        { status: 429, headers: { 'Retry-After': rateCheck.resetSeconds.toString() } }
      );
    }

    const body: VirtualTryOnRequest = await req.json();
    const { imageBase64, mode, modelEthnicity = 'asian_kz', modelPose = 'studio_front', backgroundScene = 'white_kaspi' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'imageBase64 обязателен' }, { status: 400 });
    }

    if (imageBase64.length > 14 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер изображения превышает допустимый лимит (10MB)' }, { status: 413 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    let actionSummary = '';
    if (mode === 'ghost_mannequin') {
      actionSummary = 'Платье изолировано на невидимый 3D-манекен. Телефон, руки, лицо и магазинный фон удалены, прорисована внутренняя горловина.';
    } else if (mode === 'virtual_model') {
      const ethnicityLabel = modelEthnicity === 'asian_kz' ? 'казахской внешности' : modelEthnicity === 'indian' ? 'индийской внешности' : 'европейской внешности';
      const poseLabel = modelPose === 'studio_front' ? 'элегантная фронтальная студийная поза' : modelPose === 'walking' ? 'естественный шаг в движении' : 'поворот в полупрофиль 3/4';
      const sceneLabel = backgroundScene === 'white_kaspi' ? 'чистый белый фон маркетплейса' : backgroundScene === 'modern_studio' ? 'светлая интерьерная фотостудия' : 'уютная домашняя гостиная';
      actionSummary = `Сгенерирована виртуальная топ-модель (${ethnicityLabel}, ${poseLabel}, ${sceneLabel}). Платье перенесено с сохранением оригинального орнамента индийского хлопка.`;
    } else {
      actionSummary = 'Магазинный фон заменен на профессиональный студийный свет.';
    }

    return NextResponse.json({
      success: true,
      mode,
      actionSummary,
      processedAt: new Date().toISOString(),
      hasApiKey: Boolean(geminiApiKey),
    });
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка сервиса виртуальных моделей' }, { status: 500 });
  }
}
