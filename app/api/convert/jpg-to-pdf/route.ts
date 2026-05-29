import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { convertJpgToPdf } from '@/src/lib/converters/jpgToPdf';
import type { PageOrientation, PageSizeMode, MarginOption } from '@/src/lib/converters/jpgToPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
const MAX_FILES = 20; // Maximum number of images

export async function POST(request: NextRequest) {
  let conversionId: string | null = null;

  try {
    // Get authenticated user (optional)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Extract settings from form data
    const orientation = (formData.get('orientation') as PageOrientation) || 'portrait';
    const pageSize = (formData.get('pageSize') as PageSizeMode) || 'a4';
    const margin = (formData.get('margin') as MarginOption) || 'none';
    const mergeAll = formData.get('mergeAll') !== 'false'; // default true

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate all files
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPG and PNG files are supported.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 50 MB limit` },
          { status: 400 }
        );
      }
    }

    const timestamp = Date.now();

    // Prepare image buffers
    const images = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuffer),
          originalName: file.name,
          mimeType: file.type,
        };
      })
    );

    // Upload first file as input reference to 'uploads' bucket
    const sanitizedFileName = files[0].name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = userId
      ? `${userId}/${timestamp}-${sanitizedFileName}`
      : `anonymous/${timestamp}-${sanitizedFileName}`;

    const uploadResult = await uploadFile(
      'uploads',
      storagePath,
      images[0].buffer,
      { contentType: files[0].type }
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
      file_name: files[0].name,
      file_type: files[0].type,
      file_size: files[0].size,
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
        conversion_type: 'jpg-to-pdf',
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

    // Convert images to PDF with user settings
    console.log(`[INFO] Starting JPG to PDF conversion: ${files.length} image(s), orientation=${orientation}, pageSize=${pageSize}, margin=${margin}, mergeAll=${mergeAll}`);
    const conversionResult = await convertJpgToPdf({
      images,
      orientation,
      pageSize,
      margin,
      mergeAll,
      timeout: 120000,
    });

    if (!conversionResult.success) {
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: conversionResult.error || 'JPG to PDF conversion failed',
        });
      }

      return NextResponse.json(
        { error: conversionResult.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Handle merged PDF (single file output)
    if (conversionResult.pdfBuffer) {
      const pdfBuffer = conversionResult.pdfBuffer;
      const pdfFileName = files.length === 1
        ? files[0].name.replace(/\.(jpg|jpeg|png)$/i, '.pdf')
        : `images_to_pdf_${timestamp}.pdf`;

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
            error_message: 'Failed to upload converted file to storage',
          });
          return NextResponse.json(
            { error: 'Failed to upload converted file to storage' },
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

      // Return binary PDF directly for accurate download
      const base64Pdf = pdfBuffer.toString('base64');
      const downloadUrl = signedUrl || `data:application/pdf;base64,${base64Pdf}`;

      return NextResponse.json({
        success: true,
        fileName: pdfFileName,
        fileSize: formatFileSize(pdfBuffer.length),
        downloadUrl,
        pageCount: conversionResult.pageCount,
        ...(expiresAt && { expiresAt }),
      });
    }

    // Handle separate PDFs (multiple file output)
    if (conversionResult.pdfBuffers && conversionResult.pdfBuffers.length > 0) {
      // For separate PDFs, we merge them into a zip-like response
      // or just return the first one with info about all
      // For simplicity, return individual download URLs
      const pdfFiles = conversionResult.pdfBuffers.map((pf) => ({
        fileName: pf.fileName,
        fileSize: formatFileSize(pf.buffer.length),
        downloadUrl: `data:application/pdf;base64,${pf.buffer.toString('base64')}`,
      }));

      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'completed',
        });
      }

      return NextResponse.json({
        success: true,
        multiple: true,
        files: pdfFiles,
        pageCount: conversionResult.pageCount,
      });
    }

    return NextResponse.json(
      { error: 'No output generated' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('[ERROR] JPG to PDF conversion error:', error);

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
