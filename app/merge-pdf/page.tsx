import MergePdfConverter from '@/src/components/converters/MergePdfConverter';

export const metadata = {
  title: 'Merge PDF Files - FluxConvert',
  description: 'Combine multiple PDF files into a single document. Upload, reorder, and merge your PDFs easily.',
};

export default function MergePdfPage() {
  return <MergePdfConverter />;
}
