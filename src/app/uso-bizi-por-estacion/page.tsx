import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('uso-bizi-por-estacion');
}

export default async function UsoBiziPorEstacionPage() {
  return renderSeoLandingPage('uso-bizi-por-estacion');
}
