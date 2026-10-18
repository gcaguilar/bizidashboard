// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function renderSelect(value: string) {
  return render(
    <Select value={value} onValueChange={() => {}}>
      <SelectTrigger aria-label="Filtro">
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los tipos</SelectItem>
        <SelectItem value="__all_stations__">Todas las estaciones</SelectItem>
        <SelectItem value="LOW_BIKES">Pocas bicis</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select value labels', () => {
  it('muestra la etiqueta legible en lugar del valor interno crudo', () => {
    renderSelect('all');

    expect(screen.getByRole('combobox').textContent).toContain('Todos los tipos');
  });

  it('resuelve etiquetas con sentinelas internos', () => {
    renderSelect('__all_stations__');

    expect(screen.getByRole('combobox').textContent).toContain('Todas las estaciones');
  });
});
