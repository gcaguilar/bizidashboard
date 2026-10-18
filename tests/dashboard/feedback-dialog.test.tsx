// @vitest-environment jsdom

import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackDialog } from '@/app/_components/FeedbackDialog';

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

const { trackUmamiEventMock } = vi.hoisted(() => ({
  trackUmamiEventMock: vi.fn(),
}));

vi.mock('@/lib/umami', async () => {
  const actual = await vi.importActual<typeof import('@/lib/umami')>('@/lib/umami');
  return {
    ...actual,
    trackUmamiEvent: trackUmamiEventMock,
  };
});

function renderDialog(onOpenChange = vi.fn()) {
  render(
    <FeedbackDialog
      open
      onOpenChange={onOpenChange}
      source="dashboard_header"
      module="dashboard_header"
    />
  );

  return onOpenChange;
}

describe('FeedbackDialog', () => {
  beforeEach(() => {
    trackUmamiEventMock.mockReset();
    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('tracks a positive rating in a single click and embeds tally with context', () => {
    renderDialog();

    expect(screen.getByText('¿Cómo va DatosBizi?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Me gusta' }));

    expect(trackUmamiEventMock).toHaveBeenCalledWith({
      name: 'feedback_rating',
      payload: {
        surface: 'dashboard',
        route_key: 'dashboard_home',
        source: 'dashboard_header',
        module: 'dashboard_header',
        rating: 'positive',
      },
    });
    expect(screen.getByText('Gracias por tu respuesta')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Dejar un comentario' }));

    const iframe = screen.getByTitle('Formulario de feedback de DatosBizi') as HTMLIFrameElement;
    expect(iframe.src).toContain('https://tally.so/embed/ZjRAXz');
    expect(iframe.src).toContain('rating=positive');
    expect(iframe.src).toContain('source=dashboard_header');
    expect(
      screen.getByRole('link', { name: 'Abrir el formulario en una pestaña nueva' })
    ).toBeTruthy();
  });

  it('offers to explain what failed after a negative rating', () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'No me gusta' }));

    expect(trackUmamiEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'feedback_rating',
        payload: expect.objectContaining({ rating: 'negative' }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Contar qué mejorar' }));

    const iframe = screen.getByTitle('Formulario de feedback de DatosBizi') as HTMLIFrameElement;
    expect(iframe.src).toContain('rating=negative');
  });

  it('falls back to an external link when the provider is not tally', () => {
    vi.stubEnv('NEXT_PUBLIC_FEEDBACK_URL', 'https://example.com/form');
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Me gusta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dejar un comentario' }));

    expect(screen.queryByTitle('Formulario de feedback de DatosBizi')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Abrir el formulario en una pestaña nueva' }).getAttribute('href')
    ).toBe('https://example.com/form');
  });

  it('closes the dialog when the visitor postpones the feedback', () => {
    const onOpenChange = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
