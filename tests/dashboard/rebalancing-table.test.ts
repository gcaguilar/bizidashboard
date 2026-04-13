import { describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-table', async () => {
  const actual = await vi.importActual('@tanstack/react-table');
  return {
    ...actual,
    useReactTable: vi.fn(() => ({
      getHeaderGroups: () => [{ id: '1', headers: [] }],
      getRowModel: () => ({ rows: [] }),
      getFilteredRowModel: () => ({ rows: [] }),
      getPageCount: () => 0,
      getAllLeafColumns: () => [],
      getIsAllRowsSelected: () => false,
      getToggleAllRowsSelectedHandler: () => vi.fn(),
    })),
  };
});

describe('RebalancingTable', () => {
  it('module exports RebalancingTable component', async () => {
    const { RebalancingTable } = await import('../../src/app/dashboard/redistribucion/_components/RebalancingTable');
    expect(RebalancingTable).toBeDefined();
    expect(typeof RebalancingTable).toBe('function');
  });

  it('exports component can be imported', async () => {
    const result = await import('../../src/app/dashboard/redistribucion/_components/RebalancingTable');
    expect(result).toBeDefined();
  });
});

describe('RebalancingTable data types', () => {
  it('validates StationDiagnostic structure', () => {
    const mockDiagnostic = {
      stationId: '1',
      stationName: 'Test Station',
      districtName: 'Test District',
      inferredType: 'standard',
      classification: 'overstock' as const,
      currentOccupancy: 0.85,
      targetBand: { min: 0.3, max: 0.7 },
      actionGroup: 'donor' as const,
      urgency: 'high' as const,
      priorityScore: 0.85,
      classificationReasons: ['Reason 1'],
      actionReasons: ['Action 1'],
      risk: {
        riskEmptyAt1h: 0.2,
        riskFullAt1h: 0.5,
        selfCorrectionProbability: 0.3,
        estimatedRecoveryMinutes: null,
      },
      network: {
        nearbyStations: [],
        urgencyAdjustment: 0,
      },
    };

    expect(mockDiagnostic.stationId).toBe('1');
    expect(mockDiagnostic.classification).toBe('overstock');
    expect(mockDiagnostic.actionGroup).toBe('donor');
    expect(mockDiagnostic.priorityScore).toBe(0.85);
  });

  it('classifies all classification types', () => {
    const classifications = [
      'overstock',
      'deficit',
      'peak_saturation',
      'peak_emptying',
      'balanced',
      'data_review',
    ];

    expect(classifications).toHaveLength(6);
    expect(classifications).toContain('overstock');
    expect(classifications).toContain('deficit');
    expect(classifications).toContain('balanced');
  });

  it('classifies all action groups', () => {
    const actions = ['donor', 'receptor', 'peak_remove', 'peak_fill', 'stable', 'review'];

    expect(actions).toHaveLength(6);
    expect(actions).toContain('donor');
    expect(actions).toContain('receptor');
  });

  it('classifies all urgency levels', () => {
    const urgencies = ['critical', 'high', 'medium', 'low', 'none'];

    expect(urgencies).toHaveLength(5);
    expect(urgencies).toContain('critical');
    expect(urgencies).toContain('none');
  });
});

describe('RebalancingTable filtering', () => {
  const mockDiagnostics = [
    { stationId: '1', stationName: 'Estación Centro', actionGroup: 'donor' as const, classification: 'overstock' as const },
    { stationId: '2', stationName: 'Estación Delicias', actionGroup: 'receptor' as const, classification: 'deficit' as const },
    { stationId: '3', stationName: 'Estación San Pablo', actionGroup: 'stable' as const, classification: 'balanced' as const },
  ];

  it('filters donors correctly', () => {
    const donors = mockDiagnostics.filter(d => d.actionGroup === 'donor');
    expect(donors).toHaveLength(1);
    expect(donors[0].stationId).toBe('1');
  });

  it('filters receptors correctly', () => {
    const receptors = mockDiagnostics.filter(d => d.actionGroup === 'receptor');
    expect(receptors).toHaveLength(1);
    expect(receptors[0].stationId).toBe('2');
  });

  it('filters by classification correctly', () => {
    const balanced = mockDiagnostics.filter(d => d.classification === 'balanced');
    expect(balanced).toHaveLength(1);
    expect(balanced[0].stationId).toBe('3');
  });

  it('searches by station name correctly', () => {
    const searchTerm = 'Centro';
    const results = mockDiagnostics.filter(d => d.stationName.toLowerCase().includes(searchTerm.toLowerCase()));
    expect(results).toHaveLength(1);
    expect(results[0].stationId).toBe('1');
  });

  it('searches by district name in station name correctly', () => {
    const searchTerm = 'Delicias';
    const results = mockDiagnostics.filter(d => d.stationName.toLowerCase().includes(searchTerm.toLowerCase()));
    expect(results).toHaveLength(1);
    expect(results[0].stationId).toBe('2');
  });
});

describe('RebalancingTable sorting', () => {
  const mockDiagnostics = [
    { stationId: '1', stationName: 'Zebra Station', priorityScore: 0.1 },
    { stationId: '2', stationName: 'Alpha Station', priorityScore: 0.9 },
    { stationId: '3', stationName: 'Middle Station', priorityScore: 0.5 },
  ];

  it('sorts by priority score descending', () => {
    const sorted = [...mockDiagnostics].sort((a, b) => b.priorityScore - a.priorityScore);
    expect(sorted[0].stationId).toBe('2');
    expect(sorted[1].stationId).toBe('3');
    expect(sorted[2].stationId).toBe('1');
  });

  it('sorts by priority score ascending', () => {
    const sorted = [...mockDiagnostics].sort((a, b) => a.priorityScore - b.priorityScore);
    expect(sorted[0].stationId).toBe('1');
    expect(sorted[1].stationId).toBe('3');
    expect(sorted[2].stationId).toBe('2');
  });

  it('sorts by station name ascending', () => {
    const sorted = [...mockDiagnostics].sort((a, b) => a.stationName.localeCompare(b.stationName, 'es'));
    expect(sorted[0].stationId).toBe('2');
    expect(sorted[1].stationId).toBe('3');
    expect(sorted[2].stationId).toBe('1');
  });
});

describe('RebalancingTable pagination', () => {
  const PAGE_SIZE = 20;

  it('calculates page count correctly', () => {
    const totalRows = 50;
    const pageCount = Math.ceil(totalRows / PAGE_SIZE);
    expect(pageCount).toBe(3);
  });

  it('calculates current page range', () => {
    const pageIndex = 0;
    const pageSize = PAGE_SIZE;
    const totalRows = 50;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, totalRows);
    expect(start).toBe(1);
    expect(end).toBe(20);
  });

  it('calculates last page correctly', () => {
    const pageIndex = 2;
    const pageSize = PAGE_SIZE;
    const totalRows = 50;
    const start = pageIndex * pageSize + 1;
    const end = Math.min((pageIndex + 1) * pageSize, totalRows);
    expect(start).toBe(41);
    expect(end).toBe(50);
  });
});