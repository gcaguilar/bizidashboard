// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CLAUDE_CONNECTOR_URL,
  MCP_SERVER_URL,
  McpInstallGuide,
} from '@/app/_components/McpInstallGuide';

vi.mock('@/lib/umami', () => ({
  buildCtaClickEvent: (payload: unknown) => ({ name: 'cta_click', payload }),
  trackUmamiEvent: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('McpInstallGuide', () => {
  it('renders the public MCP endpoint and its installation options', () => {
    render(<McpInstallGuide />);

    expect(screen.getByRole('heading', { name: 'BiziDashboard para Claude y ChatGPT' })).toBeTruthy();
    expect(screen.getByDisplayValue(MCP_SERVER_URL).getAttribute('readonly')).not.toBeNull();
    const claudeLink = screen.getByRole('link', { name: 'Conectar con Claude' });
    expect(claudeLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(claudeLink.getAttribute('href')).toBe(CLAUDE_CONNECTOR_URL);
  });

  it('copies the MCP URL from the generic client card', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<McpInstallGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar URL' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MCP_SERVER_URL));
    expect(await screen.findByText('URL MCP copiada.')).toBeTruthy();
  });
});
