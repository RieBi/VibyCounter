import { Counter } from '@/vibes/definitions';
import 'react-native-get-random-values';
import { createMMKV } from 'react-native-mmkv';
import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const storage = createMMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.remove(name);
  },
};

interface CounterState {
  counters: Counter[];

  addCounter: (label: string) => void;
  increment: (id: string, amount: number) => void;
  resetCounter: (id: string) => void;
  deleteCounter: (id: string) => void;
  deleteAll: () => void;
}

export const useCounterShop = create<CounterState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'counter-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
