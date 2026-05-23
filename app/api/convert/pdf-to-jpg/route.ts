import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { convertPdfToJpg, createZipFromImages } from '@/src/lib/converters/pdfToJpg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  let conversionId: string | null = null;

  try {
    // Get authenticated user (optional)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50 MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();

    // Upload input file
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = userId
      ? `${userId}/${timestamp}-${sanitizedFileName}`
      : `anonymous/${timestamp}-${sanitizedFileName}`;

    const uploadResult = await uploadFile(
      'uploads',
      storagePath,
      buffer,
      { contentType: 'application/pdf' }
    );

    if (uploadResult.error) {
      console.error('Failed to upload input file:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Create file record
    const fileRecordResult = await createFileRecord({
      user_id: userId,
      file_name: file.name,
      file_type: 'application/pdf',
      file_size: file.size,
      storage_path: uploadResult.path,
      storage_bucket: 'uploads',
    });

    if (fileRecordResult.error) {
      console.error('Failed to create file record:', fileRecordResult.error);
      return NextResponse.json(
        { error: 'Failed to create file record in database' },
        { status: 500 }
      );
    }

    // Create conversion record (authenticated users only)
    if (userId) {
      const conversionResult = await createConversionRecord({
        user_id: userId,
        input_file_id: fileRecordResult.id,
        conversion_type: 'pdf-to-jpg',
      });

      if (conversionResult.error) {
        console.error('Failed to create conversion record:', conversionResult.error);
        return NextResponse.json(
          { error: 'Failed to create conversion record in database' },
          { status: 500 }
        );
      }

      conversionId = conversionResult.id;
    }

    // Convert PDF to JPG
    console.log(`[INFO] Starting PDF to JPG conversion: ${file.name}`);
    const conversionResult = await convertPdfToJpg({
      pdfBuffer: buffer,
      quality: 90,
      scale: 2,
      timeout: 120000,
    });

    if (!conversionResult.success || !conversionResult.images || conversionResult.images.length === 0) {
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: conversionResult.error || 'PDF to JPG conversion failed',
        });
      }

      return NextResponse.json(
        { error: conversionResult.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    // If single page, return single JPG. If multi-page, return ZIP.
    let outputBuffer: Buffer;
    let outputFileName: string;
    let outputContentType: string;

    if (conversionResult.images.length === 1) {
      outputBuffer = conversionResult.images[0].buffer;
      outputFileName = file.name.replace(/\.pdf$/i, '.jpg');
      outputContentType = 'image/jpeg';
    } else {
      // Create ZIP with all images
      outputBuffer = await createZipFromImages(conversionResult.images);
      outputFileName = file.name.replace(/\.pdf$/i, '_images.zip');
      outputContentType = 'application/zip';
    }

    // Upload converted file and update records for authenticated users
    let signedUrl: string | null = null;
    let expiresAt: string | null = null;

    if (userId && conversionId) {
      const outputStoragePath = `${userId}/${timestamp}-${outputFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const outputUploadResult = await uploadFile(
        'converted',
        outputStoragePath,
        outputBuffer,
        { contentType: outputContentType }
      );

      if (outputUploadResult.error) {
        console.error('Failed to upload output file:', outputUploadResult.error);
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: 'Failed to upload converted file to storage',
        });
        return NextResponse.json(
          { error: 'Failed to upload converted file to storage' },
          { status: 500 }
        );
      }

      const outputFileRecordResult = await createFileRecord({
        user_id: userId,
        file_name: outputFileName,
        file_type: outputContentType,
        file_size: outputBuffer.length,
        storage_path: outputUploadResult.path,
        storage_bucket: 'converted',
      });

      if (outputFileRecordResult.error) {
        console.error('Failed to create output file record:', outputFileRecordResult.error);
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: 'Failed to create output file record in database',
        });
        return NextResponse.json(
          { error: 'Failed to create output file record in database' },
          { status: 500 }
        );
      }

      await updateConversionStatus({
        conversion_id: conversionId,
        status: 'completed',
        output_file_id: outputFileRecordResult.id,
      });

      const signedUrlResult = await generateSignedUrl('converted', outputUploadResult.path, 3600);
      if (!signedUrlResult.error) {
        signedUrl = signedUrlResult.url;
        expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      }
    }

    const base64Output = outputBuffer.toString('base64');
    const mimeType = outputContentType;
    const downloadUrl = signedUrl || `data:${mimeType};base64,${base64Output}`;

    return NextResponse.json({
      success: true,
      fileName: outputFileName,
      fileSize: formatFileSize(outputBuffer.length),
      downloadUrl,
      totalPages: conversionResult.totalPages,
      ...(expiresAt && { expiresAt }),
    });

  } catch (error: any) {
    console.error('[ERROR] PDF to JPG conversion error:', error);

    if (conversionId) {
      await updateConversionStatus({
        conversion_id: conversionId,
        status: 'failed',
        error_message: error.message || 'Conversion failed',
      });
    }

    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
