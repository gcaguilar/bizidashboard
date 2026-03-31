import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('redistribucion-bizi-zaragoza');
}

export default async function RedistribucionBiziZaragozaPage() {
  return renderSeoLandingPage('redistribucion-bizi-zaragoza');
}
