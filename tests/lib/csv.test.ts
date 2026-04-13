import { describe, it, expect } from 'vitest';
import { escapeCsvCell, toCsv, rowsToCsv, type CsvRow } from '@/lib/csv';

describe('csv', () => {
  describe('escapeCsvCell', () => {
    it('escapes double quotes', () => {
      expect(escapeCsvCell('foo"bar')).toBe('"foo""bar"');
    });

    it('handles null and undefined', () => {
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });

    it('handles numbers', () => {
      expect(escapeCsvCell(42)).toBe('"42"');
    });

    it('wraps strings in quotes', () => {
      expect(escapeCsvCell('hello')).toBe('"hello"');
    });
  });

  describe('toCsv', () => {
    it('creates CSV with headers and rows', () => {
      const headers = ['name', 'age'];
      const rows: CsvRow[] = [
        ['Alice', 30],
        ['Bob', 25],
      ];

      const result = toCsv(headers, rows);

      expect(result).toBe('"name","age"\n"Alice","30"\n"Bob","25"');
    });

    it('handles empty rows', () => {
      const headers = ['col1', 'col2'];
      const rows: CsvRow[] = [];

      const result = toCsv(headers, rows);

      expect(result).toBe('"col1","col2"');
    });

    it('escapes special characters in values', () => {
      const headers = ['description'];
      const rows: CsvRow[] = [
        ['Contains "quotes" and , commas'],
      ];

      const result = toCsv(headers, rows);

      expect(result).toBe('"description"\n"Contains ""quotes"" and , commas"');
    });
  });

  describe('rowsToCsv', () => {
    it('converts object array to CSV', () => {
      const headers = ['id', 'name'];
      const rows = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Example' },
      ];

      const result = rowsToCsv(headers, rows);

      expect(result).toBe('"id","name"\n"1","Test"\n"2","Example"');
    });

    it('handles missing keys', () => {
      const headers = ['id', 'name', 'extra'];
      const rows = [
        { id: 1, name: 'Test' },
      ];

      const result = rowsToCsv(headers, rows);

      expect(result).toBe('"id","name","extra"\n"1","Test",""');
    });
  });
});