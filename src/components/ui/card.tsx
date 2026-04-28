import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant =
  | 'default'
  | 'stat'
  | 'panel'
  | 'hero-card'
  | 'dashboard-card'
  | 'stat-card';

const CARD_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]',
  stat: 'gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3',
  panel: 'gap-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-0 shadow-[var(--shadow-soft)]',
  'hero-card': 'hero-card',
  'dashboard-card': 'dashboard-card',
  'stat-card': 'stat-card',
};

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = 'default', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-card-variant={variant}
      className={cn(
        'flex min-w-0 flex-col backdrop-blur-[9px]',
        CARD_VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
});

type CardWrapperProps = Omit<CardProps, 'variant'>;

const HeroCard = React.forwardRef<HTMLDivElement, CardWrapperProps>(function HeroCard(
  { className, ...props },
  ref
) {
  return <Card ref={ref} variant="hero-card" className={className} {...props} />;
});

const DashboardCard = React.forwardRef<HTMLDivElement, CardWrapperProps>(function DashboardCard(
  { className, ...props },
  ref
) {
  return <Card ref={ref} variant="dashboard-card" className={className} {...props} />;
});

const StatCard = React.forwardRef<HTMLDivElement, CardWrapperProps>(function StatCard(
  { className, ...props },
  ref
) {
  return <Card ref={ref} variant="stat-card" className={className} {...props} />;
});

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />;
  }
);

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn('text-base font-semibold leading-tight text-[var(--foreground)]', className)}
        {...props}
      />
    );
  }
);

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn('text-sm leading-relaxed text-[var(--muted)]', className)}
        {...props}
      />
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('space-y-3', className)} {...props} />;
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn('mt-auto flex items-center gap-2', className)} {...props} />;
  }
);

export {
  Card,
  DashboardCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  HeroCard,
  StatCard,
  type CardProps,
  type CardVariant,
  type CardWrapperProps,
};
