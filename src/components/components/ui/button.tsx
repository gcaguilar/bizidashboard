import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@/components/ui/slot';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'chip' | 'icon-button' | 'cta';
type ButtonSize = 'default' | 'sm' | 'icon';

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-strong)]',
  outline:
    'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--card)]',
  ghost:
    'border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]',
  chip:
    'border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]',
  'icon-button':
    'min-h-10 min-w-10 rounded-[0.65rem] border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-[0.78rem] font-bold text-[var(--primary-strong)] transition hover:-translate-y-px hover:border-[var(--primary-soft)] hover:bg-[color-mix(in_srgb,var(--primary)_16%,var(--secondary))] hover:text-white active:translate-y-0',
  cta:
    'border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]',
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'min-h-10 px-4 py-2 text-sm',
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  icon: 'h-10 w-10 p-0 text-sm',
};

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  const baseClasses =
    variant === 'icon-button'
      ? 'inline-flex items-center justify-center disabled:pointer-events-none disabled:opacity-60'
      : 'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition outline-none disabled:pointer-events-none disabled:opacity-60';
  const sizeClasses = variant === 'icon-button' && size === 'default' ? '' : BUTTON_SIZE_CLASSES[size];

  return cn(
    baseClasses,
    BUTTON_VARIANT_CLASSES[variant],
    sizeClasses,
    className
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', asChild = false, children, ...props },
  ref
) {
  const classes = buttonVariants({ variant, size, className });

  if (asChild) {
    return (
      <Slot
        ref={ref as React.Ref<HTMLElement>}
        data-button-variant={variant}
        className={classes}
        {...(props as React.HTMLAttributes<HTMLElement>)}
      >
        {children as React.ReactElement}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      data-button-variant={variant}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
});

type IconButtonProps = Omit<ButtonProps, 'variant'>;

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, size = 'default', ...props },
  ref
) {
  return <Button ref={ref} variant="icon-button" size={size} className={className} {...props} />;
});

export { Button, IconButton, type ButtonProps, type ButtonSize, type ButtonVariant, type IconButtonProps };
