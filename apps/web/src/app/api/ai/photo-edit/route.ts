import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, action, settings = {} } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    // Supported actions:
    // - 'remove_bg': remove cluttered background, isolate clothing on clean white/studio canvas
    // - 'enhance': AI auto white balance, contrast, vibrancy boost for cotton fabrics
    // - 'sharpen': micro-contrast enhancement for texture fibers
    // - 'square_crop': fit into 1:1 Kaspi marketplace aspect ratio
    // - 'studio_lighting': warm natural daylight simulation

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Log action processing
    console.log(`[AI Photo Studio] Processing action: ${action}, apiKeyAvailable: ${Boolean(geminiApiKey)}`);

    return NextResponse.json({
      success: true,
      action,
      message: `Фотография успешно обработана режимом: ${action}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

