import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('informes-mensuales-bizi-zaragoza');
}

export default async function InformesMensualesBiziZaragozaPage() {
  return renderSeoLandingPage('informes-mensuales-bizi-zaragoza');
}
