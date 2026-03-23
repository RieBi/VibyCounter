export interface Counter {
  id: string;
  groupId: string;
  label: string;
  count: number;
  settings: {
    defaultValue: number;
    incrementBy: number;
    decrementBy: number;
    allowNegative: boolean;
  };
  styling: {
    color: string;
    icon?: string;
  };

  history: HistoryEntry[];
}

export interface Group {
  id: string;
  name: string;
  styling: {
    icon?: string;
  }
}

export const DefaultGroup: Group = {
  id: 'Default',
  name: 'Default',
  styling: {
    icon: undefined,
  }
};

export const DefaultColor = '#0e7490';

export const HistoryCreation = 1;
export const HistoryIncrement = 2;
export const HistoryReset = 3;

export type HistoryAction =
  | typeof HistoryCreation
  | typeof HistoryIncrement
  | typeof HistoryReset;

export interface HistoryEntryIncrement {
  incrementBy: number;
  valueBefore: number;
  valueAfter: number;
}

export interface HistoryEntry {
  type: HistoryAction;
  timestamp: number;
  details?: HistoryEntryIncrement;
}

function isHistoryEntryIncrement(
  entry: HistoryEntry,
): entry is HistoryEntry & { details: HistoryEntryIncrement } {
  return entry.type === 2;
}

export const HistoryUtils = {
  isHistoryEntryIncrement,
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function isLightColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  );
}
