import HelpCenter from '@/src/components/pages/HelpCenter';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center - FluxConvert',
  description: 'Get help with FluxConvert tools and features. Find answers to common questions, troubleshooting guides, and learn how to use our document conversion tools effectively.',
  keywords: ['help center', 'support', 'FAQ', 'troubleshooting', 'document conversion', 'FluxConvert help'],
  openGraph: {
    title: 'Help Center - FluxConvert',
    description: 'Get help with FluxConvert tools and features. Find answers to common questions and troubleshooting guides.',
    type: 'website',
  },
};

export default function HelpCenterPage() {
  return <HelpCenter />;
}
