import WordToPdfConverter from '@/src/components/converters/WordToPdfConverter';

export const metadata = {
  title: 'Word to PDF Converter - FluxConvert',
  description: 'Convert Word documents to PDF format quickly and easily',
};

export default function WordToPdfPage() {
  return <WordToPdfConverter />;
}
