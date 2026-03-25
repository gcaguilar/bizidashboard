import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('uso-bizi-por-hora');
}

export default async function UsoBiziPorHoraPage() {
  return renderSeoLandingPage('uso-bizi-por-hora');
}
