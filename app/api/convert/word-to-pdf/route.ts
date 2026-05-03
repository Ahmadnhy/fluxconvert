import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { convertWordToPdf } from '@/src/lib/converters/libreoffice';
import { createTempFile, createTempDir } from '@/src/lib/utils/tempFiles';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  let tempInputFile: { path: string; cleanup: () => Promise<void> } | null = null;
  let tempOutputDir: { path: string; cleanup: () => Promise<void> } | null = null;
  let conversionId: string | null = null;

  try {
    // Get authenticated user (optional - handle both authenticated and unauthenticated users)
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
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Only .docx files are supported' },
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique storage path: {user_id}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = userId 
      ? `${userId}/${timestamp}-${sanitizedFileName}`
      : `anonymous/${timestamp}-${sanitizedFileName}`;

    // Upload input file to 'uploads' bucket
    const uploadResult = await uploadFile(
      'uploads',
      storagePath,
      buffer,
      { contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    );

    if (uploadResult.error) {
      console.error('Failed to upload input file:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Create file record in database
    const fileRecordResult = await createFileRecord({
      user_id: userId,
      file_name: file.name,
      file_type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

    console.log(`File uploaded successfully: ${uploadResult.path}, File record ID: ${fileRecordResult.id}`);

    // Create conversion record with pending status (only for authenticated users)
    if (userId) {
      const conversionResult = await createConversionRecord({
        user_id: userId,
        input_file_id: fileRecordResult.id,
        conversion_type: 'word-to-pdf',
      });

      if (conversionResult.error) {
        console.error('Failed to create conversion record:', conversionResult.error);
        return NextResponse.json(
          { error: 'Failed to create conversion record in database' },
          { status: 500 }
        );
      }

      conversionId = conversionResult.id;
      console.log(`Conversion record created with ID: ${conversionId}`);
    }

    // Create temporary input file from uploaded buffer
    tempInputFile = await createTempFile(buffer, {
      prefix: 'input',
      extension: 'docx',
    });

    // Create temporary output directory
    tempOutputDir = await createTempDir();

    // Call LibreOffice converter with input and output paths
    console.log(`Starting LibreOffice conversion: ${file.name}`);
    const conversionResult = await convertWordToPdf({
      inputPath: tempInputFile.path,
      outputDir: tempOutputDir.path,
      timeout: 120000, // 120 seconds
    });

    if (!conversionResult.success) {
      console.error('LibreOffice conversion failed:', conversionResult.error);
      
      // Update conversion status to failed (if authenticated user)
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: conversionResult.error || 'LibreOffice conversion failed',
        });
      }

      return NextResponse.json(
        { error: conversionResult.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Read generated PDF from temporary directory
    const pdfBytes = await fs.readFile(conversionResult.outputPath!);
    
    // Create response with PDF
    const pdfFileName = file.name.replace('.docx', '.pdf');
    
    // Upload converted file to 'converted' bucket (only for authenticated users)
    let signedUrl: string | null = null;
    let expiresAt: string | null = null;
    
    if (userId && conversionId) {
      // Upload output file to storage
      const outputStoragePath = userId 
        ? `${userId}/${timestamp}-${pdfFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        : `anonymous/${timestamp}-${pdfFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const outputUploadResult = await uploadFile(
        'converted',
        outputStoragePath,
        pdfBytes,
        { contentType: 'application/pdf' }
      );

      if (outputUploadResult.error) {
        console.error('Failed to upload output file:', outputUploadResult.error);
        // Update conversion status to failed
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

      // Create file record for output file
      const outputFileRecordResult = await createFileRecord({
        user_id: userId,
        file_name: pdfFileName,
        file_type: 'application/pdf',
        file_size: pdfBytes.length,
        storage_path: outputUploadResult.path,
        storage_bucket: 'converted',
      });

      if (outputFileRecordResult.error) {
        console.error('Failed to create output file record:', outputFileRecordResult.error);
        // Update conversion status to failed
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

      // Update conversion status to completed
      const updateResult = await updateConversionStatus({
        conversion_id: conversionId,
        status: 'completed',
        output_file_id: outputFileRecordResult.id,
      });

      if (updateResult.error) {
        console.error('Failed to update conversion status:', updateResult.error);
      }

      // Generate signed URL for download
      const signedUrlResult = await generateSignedUrl('converted', outputUploadResult.path, 3600);
      
      if (signedUrlResult.error) {
        console.error('Failed to generate signed URL:', signedUrlResult.error);
      } else {
        signedUrl = signedUrlResult.url;
        expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      }

      console.log(`Conversion completed successfully. Output file: ${outputUploadResult.path}`);
    }
    
    // For unauthenticated users or if signed URL generation failed, return base64
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');
    const downloadUrl = signedUrl || `data:application/pdf;base64,${base64Pdf}`;

    return NextResponse.json({
      success: true,
      fileName: pdfFileName,
      fileSize: formatFileSize(pdfBytes.length),
      downloadUrl,
      ...(expiresAt && { expiresAt }),
    });

  } catch (error: any) {
    console.error('Conversion error:', error);
    
    // Update conversion status to failed if we have a conversion ID
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
  } finally {
    // Clean up all temporary files in finally block (success or error)
    if (tempInputFile) {
      await tempInputFile.cleanup();
    }
    if (tempOutputDir) {
      await tempOutputDir.cleanup();
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
