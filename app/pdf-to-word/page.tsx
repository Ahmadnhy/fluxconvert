import PdfToWordConverter from '@/src/components/converters/PdfToWordConverter';

export const metadata = {
  title: 'PDF to Word Converter - FluxConvert',
  description: 'Convert PDF files to Word documents (.docx) quickly and easily. Extract text content and maintain document structure.',
};

export default function PdfToWordPage() {
  return <PdfToWordConverter />;
}
