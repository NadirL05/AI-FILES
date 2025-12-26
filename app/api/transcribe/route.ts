import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { audioFileSchema } from '@/lib/validation';
import { checkTranscribeRateLimit } from '@/lib/rate-limit';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkTranscribeRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validation du fichier audio
    try {
      audioFileSchema.parse({
        size: audioFile.size,
        type: audioFile.type,
      });
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: validationError.errors?.[0]?.message || 'Fichier audio invalide',
        },
        { status: 400 }
      );
    }

    // Limite de durée : estimer à partir de la taille (approximation)
    // Whisper supporte jusqu'à 25MB, mais on limite à 10MB pour éviter les timeouts
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier audio est trop volumineux (maximum 10MB)' },
        { status: 400 }
      );
    }

    // Convert File to OpenAI format
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

    // Create a File-like object for OpenAI
    const file = new File([audioBlob], audioFile.name, { type: audioFile.type });

    // Transcribe using Whisper avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes max

    let transcription;
    try {
      transcription = await getOpenAI().audio.transcriptions.create(
        {
          file: file,
          model: 'whisper-1',
          language: 'fr', // French
        },
        { signal: controller.signal as any }
      );
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Timeout: La transcription a pris trop de temps. Réessayez avec un fichier plus court.' },
          { status: 504 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { text: transcription.text },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

