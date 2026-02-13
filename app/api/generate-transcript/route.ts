import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranscriptSegment } from '@/types';
import { downloadFromR2, deleteFromR2 } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const parseTranscript = (text: string): TranscriptSegment[] => {
  const lines = text.split('\n');
  const segments: TranscriptSegment[] = [];

  const timeRegex = /\[?(\d{1,2}:\d{2})\]?/;
  let segmentIndex = 0;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const timestamp = match[1];
      const content = line
        .replace(match[0], '')
        .replace(/^[-:]\s*/, '')
        .trim();
      if (content) {
        segments.push({
          id: `seg-${segmentIndex++}`,
          timestamp,
          text: content,
        });
      }
    } else if (line.trim().length > 0 && segments.length > 0) {
      segments[segments.length - 1].text += ' ' + line.trim();
    }
  }

  if (segments.length === 0 && text.trim().length > 0) {
    segments.push({
      id: `seg-${segmentIndex}`,
      timestamp: '00:00',
      text: text.trim(),
    });
  }

  return segments;
};

export async function POST(request: NextRequest) {
  console.log('API Route: Transcript generation request received');
  let r2Key: string | null = null;

  try {
    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API Key present:', !!apiKey);

    if (!apiKey) {
      console.error('Gemini API Key is missing');
      return NextResponse.json(
        {
          error:
            'API Key is missing. Please set the GEMINI_API_KEY environment variable.',
        },
        { status: 500 }
      );
    }

    // Get the R2 key from request
    const body = await request.json();
    r2Key = body.r2Key;
    const contentType = body.contentType || 'video/mp4';

    if (!r2Key) {
      console.error('No R2 key provided');
      return NextResponse.json(
        { error: 'R2 key is required' },
        { status: 400 }
      );
    }

    console.log('Processing video from R2:', r2Key);

    // Download video from R2
    console.log('Downloading video from R2...');
    const videoBuffer = await downloadFromR2(r2Key);
    console.log('Video downloaded, size:', videoBuffer.length, 'bytes');

    // Convert to base64
    console.log('Converting to base64...');
    const base64Data = videoBuffer.toString('base64');
    console.log('Conversion complete, base64 length:', base64Data.length);

    // Initialize Gemini AI
    console.log('Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model:"gemini-3-flash-preview",
    });

    const prompt = `You are an expert transcriber. 
Please transcribe the audio from this video into English.

Rules:
1. If the audio is in a language other than English, translate it to English.
2. Provide timestamps at the beginning of each segment in the format [MM:SS].
3. Ignore background noise or silence.
4. Format the output clearly with one segment per line.`;

    console.log('Sending request to Gemini API...');

    // Set timeout for API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('API request timeout after 4 minutes')),
        240000
      )
    );

    const apiCallPromise = model.generateContent([
      {
        inlineData: {
          mimeType: contentType,
          data: base64Data,
        },
      },
      prompt,
    ]);

    // Race between API call and timeout
    const result = (await Promise.race([
      apiCallPromise,
      timeoutPromise,
    ])) as any;

    console.log('Response received from Gemini');

    const response = await result.response;
    const rawText = response.text();

    if (!rawText || rawText.trim().length === 0) {
      console.error('Empty response from Gemini');
      
      // Delete from R2 even on error
      if (r2Key) {
        await deleteFromR2(r2Key);
      }
      
      return NextResponse.json(
        {
          error:
            'No transcript generated. The video may not contain any audio or speech.',
        },
        { status: 422 }
      );
    }

    console.log('Parsing transcript...');
    const segments = parseTranscript(rawText);
    console.log('Segments parsed:', segments.length);

    // Delete video from R2 after successful processing
    console.log('Deleting video from R2...');
    await deleteFromR2(r2Key);
    console.log('Video deleted successfully');

    const responseData = {
      raw: rawText,
      segments,
    };

    console.log('Sending successful response');
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Gemini API Error Details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // Try to delete from R2 even on error
    if (r2Key) {
      try {
        console.log('Attempting to delete video from R2 after error...');
        await deleteFromR2(r2Key);
        console.log('Video deleted after error');
      } catch (deleteError: any) {
        console.error('Failed to delete video from R2:', deleteError.message);
      }
    }

    // Handle specific error types
    let errorMessage = 'Failed to generate transcript.';
    let statusCode = 500;

    if (error.message?.includes('timeout')) {
      errorMessage =
        'Request timeout. The video may be too long or complex. Try a shorter video.';
      statusCode = 504;
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Invalid file format or corrupted video.';
      statusCode = 422;
    } else if (error.message?.includes('R2') || error.message?.includes('S3')) {
      errorMessage = 'Failed to access video storage. Please try uploading again.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
