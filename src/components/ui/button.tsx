import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'chip' | 'icon-button';
type ButtonSize = 'default' | 'sm' | 'icon';

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    'border-transparent bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]',
  outline:
    'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]',
  ghost:
    'border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-soft)]',
  chip:
    'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]',
  'icon-button': 'icon-button',
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
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      data-button-variant={variant}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
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
