export interface Counter {
  id: string;
  groupId: string;
  label: string;
  count: number;
  settings?: {
    incrementBy: number;
    decrementBy: number;
    allowNegative: boolean;
  };

  history: HistoryEntry[];
}

export interface Group {
  id: string;
  name: string;
}

export const DefaultGroup: Group = {
  id: 'Default',
  name: 'Default',
};

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
