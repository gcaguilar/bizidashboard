import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('barrios-bizi-zaragoza');
}

export default async function BarriosBiziZaragozaPage() {
  return renderSeoLandingPage('barrios-bizi-zaragoza');
}
