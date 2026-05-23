import PdfToJpgConverter from '@/src/components/converters/PdfToJpgConverter';

export const metadata = {
  title: 'PDF to JPG Converter - FluxConvert',
  description: 'Convert PDF files to high-quality JPG images. Each page will be converted to a separate JPG image.',
};

export default function PdfToJpgPage() {
  return <PdfToJpgConverter />;
}
