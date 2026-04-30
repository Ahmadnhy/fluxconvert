import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
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
    let conversionId: string | null = null;
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

    // Extract text and HTML from Word document using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Parse HTML and extract text
    const textContent = html.replace(/<[^>]*>/g, '\n').trim();
    const lines = textContent.split('\n').filter(line => line.trim());
    
    // Add text to PDF with proper pagination
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const margin = 50;
    const pageWidth = 595.28; // A4 width
    const pageHeight = 841.89; // A4 height
    const maxWidth = pageWidth - (margin * 2);
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Check if we need a new page
      if (yPosition < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }
      
      // Wrap text if too long
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = testLine.length * (fontSize * 0.5); // Approximate width
        
        if (textWidth > maxWidth && currentLine) {
          // Draw current line
          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= lineHeight;
          
          // Check if we need a new page
          if (yPosition < margin + lineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
          
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      // Draw remaining text
      if (currentLine) {
        currentPage.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight;
      }
    }

    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
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
        Buffer.from(pdfBytes),
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
    
    // If we have a conversion ID, update status to failed
    // Note: conversionId is not accessible here, so we'll handle this in a finally block
    
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
