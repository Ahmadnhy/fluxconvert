import WordToPdfConverter from '@/src/components/converters/WordToPdfConverter';

export const metadata = {
  title: 'Word to PDF Converter - FluxConvert',
  description: 'Convert Word documents (.docx) to PDF format easily and quickly',
};

export default function WordToPdfPage() {
  return <WordToPdfConverter />;
}
