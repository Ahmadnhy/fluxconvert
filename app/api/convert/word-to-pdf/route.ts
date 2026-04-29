import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  try {
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

    // Extract text and HTML from Word document using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    const { width, height } = page.getSize();
    
    // Parse HTML and extract text (simplified version)
    // In production, you'd want to use a proper HTML to PDF library
    const textContent = html.replace(/<[^>]*>/g, '\n').trim();
    const lines = textContent.split('\n').filter(line => line.trim());
    
    // Add text to PDF
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    let yPosition = height - 50;
    
    for (const line of lines) {
      if (yPosition < 50) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = newPage.getSize().height - 50;
      }
      
      page.drawText(line.substring(0, 80), { // Limit line length
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= lineHeight;
    }

    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create response with PDF
    const pdfFileName = file.name.replace('.docx', '.pdf');
    
    // In production, you would upload to Supabase Storage here
    // For now, we'll return the PDF as base64
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');
    const downloadUrl = `data:application/pdf;base64,${base64Pdf}`;

    return NextResponse.json({
      success: true,
      fileName: pdfFileName,
      fileSize: formatFileSize(pdfBytes.length),
      downloadUrl,
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
