import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { splitPdf, getPdfPageCount } from '@/src/lib/converters/splitPdf';

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
    const pageRanges = formData.get('pageRanges') as string;

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

    if (!pageRanges || pageRanges.trim() === '') {
      return NextResponse.json(
        { error: 'Page ranges are required (e.g., "1-3, 5, 7-10")' },
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
        conversion_type: 'split-pdf',
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

    // Split PDF
    console.log(`[INFO] Starting PDF split: ${file.name}, pages: ${pageRanges}`);
    const splitResult = await splitPdf({
      pdfBuffer: buffer,
      pageRanges,
      timeout: 60000,
    });

    if (!splitResult.success || !splitResult.pdfBuffer) {
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: splitResult.error || 'PDF split failed',
        });
      }

      return NextResponse.json(
        { error: splitResult.error || 'Split failed' },
        { status: 500 }
      );
    }

    const pdfBuffer = splitResult.pdfBuffer;
    const pdfFileName = file.name.replace(/\.pdf$/i, `_pages_${pageRanges.replace(/\s/g, '')}.pdf`);

    // Upload converted file and update records for authenticated users
    let signedUrl: string | null = null;
    let expiresAt: string | null = null;

    if (userId && conversionId) {
      const outputStoragePath = `${userId}/${timestamp}-${pdfFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const outputUploadResult = await uploadFile(
        'converted',
        outputStoragePath,
        pdfBuffer,
        { contentType: 'application/pdf' }
      );

      if (outputUploadResult.error) {
        console.error('Failed to upload output file:', outputUploadResult.error);
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: 'Failed to upload split file to storage',
        });
        return NextResponse.json(
          { error: 'Failed to upload split file to storage' },
          { status: 500 }
        );
      }

      const outputFileRecordResult = await createFileRecord({
        user_id: userId,
        file_name: pdfFileName,
        file_type: 'application/pdf',
        file_size: pdfBuffer.length,
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

    const base64Pdf = pdfBuffer.toString('base64');
    const downloadUrl = signedUrl || `data:application/pdf;base64,${base64Pdf}`;

    return NextResponse.json({
      success: true,
      fileName: pdfFileName,
      fileSize: formatFileSize(pdfBuffer.length),
      downloadUrl,
      extractedPages: splitResult.extractedPages,
      totalPages: splitResult.totalPages,
      ...(expiresAt && { expiresAt }),
    });

  } catch (error: any) {
    console.error('[ERROR] PDF split error:', error);

    if (conversionId) {
      await updateConversionStatus({
        conversion_id: conversionId,
        status: 'failed',
        error_message: error.message || 'Split failed',
      });
    }

    return NextResponse.json(
      { error: error.message || 'Split failed' },
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
