import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/server-auth';

export interface GenerateCopyRequest {
  titleRu: string;
  category: string;
  compositionRu: string;
  tone?: 'commercial' | 'cozy' | 'premium';
}

const CATEGORY_NAMES: Record<string, { ru: string; kz: string }> = {
  tunics: { ru: 'Платья и туники', kz: 'Көйлектер мен туникалар' },
  pajamas: { ru: 'Пижамы и домашняя одежда', kz: 'Пижамалар және үй киімі' },
  't-shirts': { ru: 'Футболки и поло', kz: 'Футболкалар мен поло' },
  underwear: { ru: 'Нижнее белье и термобелье', kz: 'Іш киім және термоішкиім' },
  textiles: { ru: 'Домашний текстиль', kz: 'Үй тоқымасы' },
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`ai:copy:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов к генератору описаний. Пожалуйста, подождите 1 минуту.' },
        { status: 429, headers: { 'Retry-After': rateCheck.resetSeconds.toString() } }
      );
    }

    const body: GenerateCopyRequest = await req.json();
    const { titleRu, category, compositionRu } = body;

    if (!titleRu || typeof titleRu !== 'string' || titleRu.trim().length === 0) {
      return NextResponse.json({ error: 'Параметр titleRu обязателен' }, { status: 400 });
    }
    if (titleRu.length > 300) {
      return NextResponse.json({ error: 'Название товара превышает допустимую длину (300 символов)' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const catName = CATEGORY_NAMES[category]?.ru || category || 'Одежда';
    const catNameKz = CATEGORY_NAMES[category]?.kz || category || 'Киім';

    let generatedRu = '';
    let generatedKz = '';

    // If Gemini API Key is configured, query Gemini 1.5 Flash
    if (geminiApiKey) {
      try {
        const prompt = `Ты — профессиональный fashion-копирайтер сети магазинов «Индийский Трикотаж» (Алматы).
ВАЖНОЕ ПОЗИЦИОНИРОВАНИЕ БРЕНДА:
«Индийский Трикотаж» — это название розничной сети (16 филиалов в ТЦ Алматы). Сеть продает качественную современную базовую и повседневную одежду, трикотаж и домашний текстиль прямого фабричного импорта (Индия, Китай, Пакистан, Узбекистан): базовые футболки, худи, лонгсливы, спортивные костюмы, джоггеры, пижамы, халаты, термобелье. Это современная одежда Casual и домашний уют, НЕ национальные или традиционные наряды!
Напиши продающее, уютное и информативное описание для карточки товара на двух языках (русский и казахский).
Товар: ${titleRu.slice(0, 150)}
Категория: ${catName}
Состав ткани: ${(compositionRu || '100% натуральный хлопок').slice(0, 100)}
Акценты: практичность, натуральность, мягкость трикотажа, фабричный пошив, воздухопроницаемость, стойкость к стиркам, комфортная посадка, удобство в климате Алматы.

Верни СТРОГО валидный JSON без markdown:
{
  "descriptionRu": "продающее описание на русском (3-4 содержательных предложения с преимуществами)",
  "descriptionKz": "продающее описание на казахском языке (қазақша көркем сипаттама, 3-4 сөйлем)"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed.descriptionRu) generatedRu = parsed.descriptionRu;
            if (parsed.descriptionKz) generatedKz = parsed.descriptionKz;
          }
        }
      } catch (e) {
        console.warn('Gemini generate copy fallback:', e);
      }
    }

    // High quality contextual fallback generator (if offline or no key)
    if (!generatedRu) {
      if (category === 'pajamas') {
        generatedRu = `Уютный комплект «${titleRu}» подарит максимальный комфорт во время отдыха и сна. Изготовлен из ${compositionRu || '100% гребенного хлопка'}, который не вызывает раздражения, приятно прилегает к телу и отлично впитывает влагу. Свободный анатомический крой не сковывает движений, а плотное фабричное переплетение волокон предотвращает образование катышков.`;
        generatedKz = `«${titleRu}» жайлы топтамасы ұйқы мен демалыс кезінде барынша жайлылық сыйлайды. ${compositionRu || '100% табиғи мақтадан'} жасалған, денеге жағымды және ылғалды жақсы сіңіреді. Еркін тігісі қимыл-қозғалысқа кедергі жасамайды, матасы түктенбейді.`;
      } else if (category === 't-shirts') {
        generatedRu = `Базовая футболка «${titleRu}» премиального качества из плотного хлопкового трикотажа (${compositionRu || '100% хлопок'}). Плотный, но дышащий материал обеспечивает комфорт в течение всего дня, а усиленный воротник держит форму и не растягивается. Универсальный силуэт легко сочетается с джинсами, шортами и спортивным стилем.`;
        generatedKz = `Мақта трикотажынан (${compositionRu || '100% мақта'}) жасалған жоғары сапалы базалық «${titleRu}» футболкасы. Тығыз әрі дем алатын мата күні бойы жайлылық береді, жағасы созылмай пішінін сақтайды. Кез келген стильмен үйлесімді үйлеседі.`;
      } else {
        generatedRu = `Качественное изделие «${titleRu}» прямого фабричного производства. В составе: ${compositionRu || '100% сертифицированный эко-хлопок'}. Мягкий гипоаллергенный трикотаж превосходно носится, устойчив к деформации и приятен на ощупь. Подходит для комфортного ежедневного использования.`;
        generatedKz = `Тікелей фабрикада өндірілген сапалы «${titleRu}» бұйымы. Құрамы: ${compositionRu || '100% сертификатталған эко-мақта'}. Гипоаллергенді жұмсақ трикотаж ұзақ киіледі, пішінін өзгертпейді және денеге өте жағымды.`;
      }
    }

    return NextResponse.json({
      success: true,
      descriptionRu: generatedRu,
      descriptionKz: generatedKz,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка сервиса генерации текста' }, { status: 500 });
  }
}
