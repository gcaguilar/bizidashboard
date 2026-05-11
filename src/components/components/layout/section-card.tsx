import type { ComponentProps } from 'react';
import { Card } from '@/components/ui/card';

type SectionCardProps = Omit<ComponentProps<typeof Card>, 'variant'>;

export function SectionCard(props: SectionCardProps) {
  return <Card variant='section' {...props} />;
}

type HeroSectionCardProps = Omit<ComponentProps<typeof Card>, 'variant'>;

export function HeroSectionCard(props: HeroSectionCardProps) {
  return <Card variant='hero' {...props} />;
}

type MetricSectionCardProps = Omit<ComponentProps<typeof Card>, 'variant'>;

export function MetricSectionCard(props: MetricSectionCardProps) {
  return <Card variant='metric' {...props} />;
}
