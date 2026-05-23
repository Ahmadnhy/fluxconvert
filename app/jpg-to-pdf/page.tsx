import JpgToPdfConverter from '@/src/components/converters/JpgToPdfConverter';

export const metadata = {
  title: 'JPG to PDF Converter - FluxConvert',
  description: 'Convert JPG and PNG images to PDF format. Upload multiple images and combine them into a single PDF document.',
};

export default function JpgToPdfPage() {
  return <JpgToPdfConverter />;
}
