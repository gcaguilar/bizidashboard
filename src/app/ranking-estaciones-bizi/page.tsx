import type { Metadata } from 'next';
import {
  generateSeoLandingMetadata,
  renderSeoLandingPage,
} from '@/app/_seo/SeoLandingPage';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoLandingMetadata('ranking-estaciones-bizi');
}

export default async function RankingEstacionesBiziPage() {
  return renderSeoLandingPage('ranking-estaciones-bizi');
}
