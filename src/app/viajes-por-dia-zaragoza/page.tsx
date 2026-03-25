import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('viajes-por-dia-zaragoza');
}

export default async function ViajesPorDiaZaragozaPage() {
  return renderSeoLandingPage('viajes-por-dia-zaragoza');
}
