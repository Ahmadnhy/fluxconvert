import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';
import { convertPdfToWord } from '@/src/lib/converters/pdfToWord';
import { createTempFile, cleanupTempFiles } from '@/src/lib/utils/tempFiles';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  let tempInputFile: { path: string; cleanup: () => Promise<void> } | null = null;
  let tempOutputPath: string | null = null;
  
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
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only .pdf files are supported' },
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
      { contentType: file.type || 'application/pdf' }
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
      file_type: file.type || 'application/pdf',
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
    let conversionId: string | null = null;
    if (userId) {
      const conversionResult = await createConversionRecord({
        user_id: userId,
        input_file_id: fileRecordResult.id,
        conversion_type: 'pdf-to-word',
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
    try {
      tempInputFile = await createTempFile(buffer, {
        prefix: 'input',
        extension: 'pdf',
      });
      console.log(`[INFO] Temporary input file created: ${tempInputFile.path}`);
    } catch (error: any) {
      console.error('[ERROR] Failed to create temporary input file:', error);
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: `Failed to create temporary input file: ${error.message}`,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to create temporary input file' },
        { status: 500 }
      );
    }

    // Create temporary output file path
    const docxFileName = file.name.replace('.pdf', '.docx');
    const outputFileName = `output-${timestamp}-${docxFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    tempOutputPath = path.join(path.dirname(tempInputFile.path), outputFileName);
    console.log(`[INFO] Temporary output file path: ${tempOutputPath}`);

    // Call PDF-to-Word converter with input and output paths (PDF → Extract Text → Auto Detect Structure → Generate DOCX)
    console.log(`[INFO] Starting PDF-to-Word pipeline conversion: ${tempInputFile.path} -> ${tempOutputPath}`);
    const pipelineStartTime = Date.now();
    
    const conversionResult = await convertPdfToWord({
      inputPath: tempInputFile.path,
      outputPath: tempOutputPath,
      timeout: 120000, // 120 seconds
    });

    if (!conversionResult.success) {
      console.error('[ERROR] PDF-to-Word pipeline conversion failed:', conversionResult.error);
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: conversionResult.error || 'PDF to Word conversion failed',
        });
      }
      
      return NextResponse.json(
        { error: conversionResult.error || 'PDF to Word conversion failed' },
        { status: 500 }
      );
    }

    const pipelineDuration = Date.now() - pipelineStartTime;
    console.log(`[INFO] PDF-to-Word pipeline conversion completed successfully in ${pipelineDuration}ms: ${conversionResult.outputPath}`);
    
    // Log detected structure information
    if (conversionResult.detectedStructure) {
      console.log(`[INFO] Detected structure: ${conversionResult.detectedStructure.headings} heading(s), ${conversionResult.detectedStructure.paragraphs} paragraph(s), ${conversionResult.detectedStructure.tables} table(s)`);
    }

    // Read generated DOCX from temporary directory
    let docxBuffer: Buffer;
    try {
      docxBuffer = await fs.readFile(tempOutputPath);
      console.log(`[INFO] Read output file: ${tempOutputPath}, size: ${docxBuffer.length} bytes`);
    } catch (error: any) {
      console.error('[ERROR] Failed to read output file:', error);
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: `Failed to read converted file: ${error.message}`,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to read converted file' },
        { status: 500 }
      );
    }

    // Upload DOCX to Supabase Storage (converted bucket)
    let signedUrl: string | null = null;
    let expiresAt: string | null = null;
    
    if (userId && conversionId) {
      // Upload output file to storage
      const outputStoragePath = userId 
        ? `${userId}/${timestamp}-${docxFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        : `anonymous/${timestamp}-${docxFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const outputUploadResult = await uploadFile(
        'converted',
        outputStoragePath,
        docxBuffer,
        { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
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
        file_name: docxFileName,
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: docxBuffer.length,
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
    const base64Docx = docxBuffer.toString('base64');
    const downloadUrl = signedUrl || `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Docx}`;

    return NextResponse.json({
      success: true,
      fileName: docxFileName,
      fileSize: formatFileSize(docxBuffer.length),
      downloadUrl,
      ...(expiresAt && { expiresAt }),
    });

  } catch (error: any) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  } finally {
    // Clean up all temporary files in finally block (success or error)
    const tempPaths: string[] = [];
    
    if (tempInputFile) {
      tempPaths.push(tempInputFile.path);
    }
    
    if (tempOutputPath) {
      tempPaths.push(tempOutputPath);
    }
    
    if (tempPaths.length > 0) {
      try {
        await cleanupTempFiles(tempPaths);
        console.log('[INFO] Temporary files cleaned up successfully');
      } catch (cleanupError) {
        console.error('[ERROR] Failed to cleanup temporary files:', cleanupError);
        // Don't throw - cleanup is best-effort
      }
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
