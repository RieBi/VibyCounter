import {
  Counter,
  DefaultGroup,
  Group,
  HistoryCreation,
  HistoryIncrement,
  HistoryReset,
} from '@/vibes/definitions';
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
  groups: Group[];

  addCounter: (label: string, groupId?: string) => void;
  updateCounter: (id: string, updates: Partial<Counter>) => void;
  increment: (id: string, amount: number) => void;
  resetCounter: (id: string) => void;
  deleteCounter: (id: string) => void;
  deleteAll: () => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
}

export const useCounterShop = create<CounterState>()(
  persist(
    (set) => ({
      counters: [],
      groups: [DefaultGroup],

      addCounter: (label, groupId) =>
        set((state) => ({
          counters: [
            ...state.counters,
            {
              id: uuid(),
              label,
              count: 0,
              history: [{ type: HistoryCreation, timestamp: Date.now() }],
              groupId: groupId ?? DefaultGroup.id,
            },
          ],
        })),

      updateCounter: (id, updates) =>
        set((state) => ({
          counters: state.counters.map((counter) =>
            counter.id === id ? { ...counter, ...updates } : counter,
          ),
        })),

      increment: (id, amount) =>
        set((state) => ({
          counters: state.counters.map((counter) =>
            counter.id === id
              ? {
                  ...counter,
                  count: counter.count + amount,
                  history: [
                    ...counter.history,
                    {
                      type: HistoryIncrement,
                      timestamp: Date.now(),
                      details: {
                        incrementBy: amount,
                        valueBefore: counter.count,
                        valueAfter: counter.count + amount,
                      },
                    },
                  ],
                }
              : counter,
          ),
        })),

      resetCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  count: 0,
                  history: [
                    ...c.history,
                    { type: HistoryReset, timestamp: Date.now() },
                  ],
                }
              : c,
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
      addGroup: (name) =>
        set((state) => ({
          groups: [...state.groups, { id: uuid(), name }],
        })),
      renameGroup: (id, newName) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, name: newName } : group,
          ),
        })),
      deleteGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          counters: state.counters.map((counter) =>
            counter.groupId === id
              ? { ...counter, groupId: DefaultGroup.id }
              : counter,
          ),
        })),
    }),
    {
      name: 'counter-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
