import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('viajes-por-mes-zaragoza');
}

export default async function ViajesPorMesZaragozaPage() {
  return renderSeoLandingPage('viajes-por-mes-zaragoza');
}
