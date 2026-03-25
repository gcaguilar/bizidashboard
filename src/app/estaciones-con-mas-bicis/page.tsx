import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('estaciones-con-mas-bicis');
}

export default async function EstacionesConMasBicisPage() {
  return renderSeoLandingPage('estaciones-con-mas-bicis');
}
