import { Counter } from '@/vibes/definitions';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { create } from 'zustand';

interface CounterState {
  counters: Counter[];

  addCounter: (label: string) => void;
  increment: (id: string, amount: number) => void;
  resetCounter: (id: string) => void;
  deleteCounter: (id: string) => void;
  deleteAll: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  counters: [],

  addCounter: (label) =>
    set((state) => ({
      counters: [...state.counters, { id: uuid(), label, count: 0 }],
    })),

  increment: (id, amount) =>
    set((state) => ({
      counters: state.counters.map((counter) =>
        counter.id === id
          ? { ...counter, count: counter.count + amount }
          : counter,
      ),
    })),

  resetCounter: (id) =>
    set((state) => ({
      counters: state.counters.map((c) =>
        c.id === id ? { ...c, count: 0 } : c,
      ),
    })),

  deleteCounter: (id) =>
    set((state) => ({
      counters: state.counters.filter((c) => c.id !== id),
    })),

  deleteAll: () =>
    set(() => ({
      counters: [],
    })),
}));
