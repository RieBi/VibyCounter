export interface Counter {
  id: string;
  groupId: string;
  label: string;
  count: number;
  settings: {
    defaultValue: number;
    incrementBy: number;
    decrementBy: number;
    minValue?: number;
    maxValue?: number;
    goal?: number;
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
  };
}

export const DefaultGroup: Group = {
  id: 'Default',
  name: 'Default',
  styling: {
    icon: undefined,
  },
};

export const DefaultColor = '#0e7490';

export const HistoryAction = {
  Creation: 1,
  Increment: 2,
  Reset: 3,
  SettingsChange: 4,
} as const;

export type HistoryAction = (typeof HistoryAction)[keyof typeof HistoryAction];

export interface HistoryEntryChange {
  field: string;
  from: string;
  to: string;
}

export interface HistoryEntryIncrement {
  incrementBy: number;
  valueBefore: number;
  valueAfter: number;
}

export interface HistoryEntry {
  type: HistoryAction;
  timestamp: number;
  details?: HistoryEntryIncrement;
  changes?: HistoryEntryChange[];
}

function isHistoryEntryIncrement(
  entry: HistoryEntry,
): entry is HistoryEntry & { details: HistoryEntryIncrement } {
  return entry.type === HistoryAction.Increment;
}

export const HistoryUtils = {
  isHistoryEntryIncrement,
};

export function getProgress(
  count: number,
  defaultValue: number,
  goal: number,
): number {
  const total = goal - defaultValue;
  if (total === 0) return count === goal ? 1 : 0;
  const progress = (count - defaultValue) / total;
  return Math.min(Math.max(progress, 0), 1);
}

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

export type SortField = 'manual' | 'name' | 'value' | 'created' | 'lastAction';
export type SortDirection = 'asc' | 'desc';

export function getLastActionTimestamp(counter: Counter): number {
  if (counter.history.length === 0) return 0;
  return counter.history[counter.history.length - 1].timestamp;
}

export function getCreationTimestamp(counter: Counter): number {
  const creation = counter.history.find(
    (h) => h.type === HistoryAction.Creation,
  );
  return creation?.timestamp ?? 0;
}

export function sortCounters(
  counters: Counter[],
  field: SortField,
  direction: SortDirection,
): Counter[] {
  if (field === 'manual') return counters;

  const sorted = [...counters].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'name':
        cmp = a.label.localeCompare(b.label);
        break;
      case 'value':
        cmp = a.count - b.count;
        break;
      case 'created':
        cmp = getCreationTimestamp(a) - getCreationTimestamp(b);
        break;
      case 'lastAction':
        cmp = getLastActionTimestamp(a) - getLastActionTimestamp(b);
        break;
    }
    return direction === 'desc' ? -cmp : cmp;
  });

  return sorted;
}
