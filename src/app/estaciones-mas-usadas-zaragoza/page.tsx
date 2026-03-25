import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('estaciones-mas-usadas-zaragoza');
}

export default async function EstacionesMasUsadasPage() {
  return renderSeoLandingPage('estaciones-mas-usadas-zaragoza');
}
