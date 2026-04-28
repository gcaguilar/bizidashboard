import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'stat' | 'panel';

const CARD_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]',
  stat: 'gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3',
  panel: 'gap-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-0 shadow-[var(--shadow-soft)]',
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
      className={cn(
        'flex min-w-0 flex-col backdrop-blur-[9px]',
        CARD_VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
  type CardVariant,
};
