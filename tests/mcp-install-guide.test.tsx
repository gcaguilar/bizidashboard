// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHATGPT_PLUGINS_URL,
  CLAUDE_CONNECTOR_URL,
  MCP_CLIENT_ID,
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

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  return writeText;
}

describe('McpInstallGuide', () => {
  it('renders the public credentials and the Claude and ChatGPT options', () => {
    render(<McpInstallGuide />);

    expect(screen.getByRole('heading', { name: 'BiziDashboard para tu asistente de IA' })).toBeTruthy();
    expect(screen.getByDisplayValue(MCP_SERVER_URL).getAttribute('readonly')).not.toBeNull();
    expect(screen.getByDisplayValue(MCP_CLIENT_ID).getAttribute('readonly')).not.toBeNull();
    expect(screen.getByText('read:dashboard')).toBeTruthy();
    expect(screen.getByText('read:exports')).toBeTruthy();
    expect(screen.getByText('Client Secret:')).toBeTruthy();

    const claudeLink = screen.getByRole('link', { name: 'Conectar con Claude' });
    expect(claudeLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(claudeLink.getAttribute('href')).toBe(CLAUDE_CONNECTOR_URL);

    const chatgptLink = screen.getByRole('link', { name: 'Abrir Plugins de ChatGPT' });
    expect(chatgptLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(chatgptLink.getAttribute('href')).toBe(CHATGPT_PLUGINS_URL);

    expect(screen.getByRole('heading', { name: 'Claude' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'ChatGPT' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Perplexity' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Grok' })).toBeNull();
  });

  it('copies the MCP URL', async () => {
    const writeText = mockClipboard();

    render(<McpInstallGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar URL' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MCP_SERVER_URL));
    expect(await screen.findByText('URL MCP copiada.')).toBeTruthy();
  });

  it('copies the OAuth client ID', async () => {
    const writeText = mockClipboard();

    render(<McpInstallGuide />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar Client ID' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MCP_CLIENT_ID));
    expect(await screen.findByText('Client ID copiado.')).toBeTruthy();
  });

  it('explains how to verify the connection and what to do when it fails', () => {
    render(<McpInstallGuide />);

    expect(screen.getByRole('heading', { name: 'Comprueba que funciona' })).toBeTruthy();
    expect(screen.getByText(/Lista los dashboards disponibles/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Problemas frecuentes' })).toBeTruthy();
    expect(screen.getByText(/is not authorized to access resource server/i)).toBeTruthy();
    expect(screen.getByText(/too_many_entities/i)).toBeTruthy();
  });
});
