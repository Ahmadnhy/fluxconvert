import WordToPdfConverter from '@/src/components/converters/WordToPdfConverter';
import { QuotaProvider } from '@/src/contexts/QuotaContext';

export const metadata = {
  title: 'Word to PDF Converter - FluxConvert',
  description: 'Convert Word documents (.docx) to PDF format easily and quickly',
};

export default function WordToPdfPage() {
  return (
    <QuotaProvider>
      <WordToPdfConverter />
    </QuotaProvider>
  );
}
