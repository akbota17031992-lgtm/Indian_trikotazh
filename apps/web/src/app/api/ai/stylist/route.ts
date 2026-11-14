import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/server-auth';
import { analyzeStyleAndMatchOutfit, type StylistRequest } from '@/lib/stylist-service';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`ai:stylist:${ip}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Слишком много обращений к ИИ-стилисту. Пожалуйста, подождите 1 минуту.' },
        { status: 429, headers: { 'Retry-After': rateCheck.resetSeconds.toString() } }
      );
    }

    const body: StylistRequest = await req.json();
    const result = analyzeStyleAndMatchOutfit(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Stylist error:', error);
    return NextResponse.json(
      { error: 'Не удалось завершить подбор стиля. Попробуйте еще раз.' },
      { status: 500 }
    );
  }
}
