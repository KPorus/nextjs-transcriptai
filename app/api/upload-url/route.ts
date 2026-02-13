import { NextRequest, NextResponse } from 'next/server';
import { getUploadPresignedUrl } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename and contentType are required' },
        { status: 400 }
      );
    }

    console.log('Generating presigned URL for:', filename);

    const { uploadUrl, key } = await getUploadPresignedUrl(filename, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
