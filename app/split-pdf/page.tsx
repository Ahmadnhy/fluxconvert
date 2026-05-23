import SplitPdfConverter from '@/src/components/converters/SplitPdfConverter';

export const metadata = {
  title: 'Split PDF - FluxConvert',
  description: 'Extract specific pages from your PDF document. Specify page ranges and get a new PDF with only the pages you need.',
};

export default function SplitPdfPage() {
  return <SplitPdfConverter />;
}
