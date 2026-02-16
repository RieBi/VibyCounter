export type ActionType = 'increment' | 'decrement' | 'reset';

export interface HistoryLog {
  id: string;
  timestamp: number;
  action: ActionType;
  valueAtTime: number;
}

export interface Counter {
  id: string;
  groupId?: string | null;
  label: string;
  count: number;
  settings?: {
    incrementBy: number;
    decrementBy: number;
    allowNegative: boolean;
  };

  history?: HistoryLog[];
}

export interface Group {
  id: string;
  name: string;
}
