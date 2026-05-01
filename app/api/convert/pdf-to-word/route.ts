import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { createClient } from '@/src/lib/supabase/server';
import { uploadFile } from '@/src/lib/storage/operations';
import { createFileRecord } from '@/src/lib/database/files';
import { createConversionRecord, updateConversionStatus } from '@/src/lib/database/conversions';
import { generateSignedUrl } from '@/src/lib/storage/signedUrls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
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

    // Parse PDF and extract text content
    let textResult;
    try {
      textResult = await pdfParse(buffer);
    } catch (error: any) {
      console.error('PDF parsing failed:', error);
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: `Failed to parse PDF: ${error.message || 'Unknown error'}`,
        });
      }
      
      return NextResponse.json(
        { error: `Failed to parse PDF: ${error.message || 'Invalid or corrupted PDF file'}` },
        { status: 500 }
      );
    }

    const textContent = textResult.text;

    // Check if PDF contains extractable text
    if (!textContent || textContent.trim().length === 0) {
      console.error('PDF contains no extractable text content');
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: 'PDF contains no extractable text content',
        });
      }
      
      return NextResponse.json(
        { error: 'PDF contains no extractable text content' },
        { status: 500 }
      );
    }

    // Generate DOCX document from extracted text
    let docxBuffer: Buffer;
    try {
      // Split text into paragraphs (double newline = paragraph break)
      const paragraphTexts = textContent
        .split('\n\n')
        .filter(text => text.trim().length > 0);

      // Create paragraphs with proper text runs
      const paragraphs = paragraphTexts.map(text => 
        new Paragraph({
          children: [new TextRun(text.trim())]
        })
      );

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      // Generate buffer
      docxBuffer = await Packer.toBuffer(doc);
    } catch (error: any) {
      console.error('DOCX generation failed:', error);
      
      // Update conversion status to failed if we have a conversion ID
      if (userId && conversionId) {
        await updateConversionStatus({
          conversion_id: conversionId,
          status: 'failed',
          error_message: `Failed to generate Word document: ${error.message || 'Unknown error'}`,
        });
      }
      
      return NextResponse.json(
        { error: `Failed to generate Word document: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Create response with DOCX
    const docxFileName = file.name.replace('.pdf', '.docx');
    
    // Upload converted file to 'converted' bucket (only for authenticated users)
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
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
