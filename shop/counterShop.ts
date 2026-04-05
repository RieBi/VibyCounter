import {
  Counter,
  DefaultGroup,
  Group,
  HistoryAction,
} from '@/vibes/definitions';
import { useSettingsShop } from '@/shop/settingsShop';
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

export interface PendingDelete {
  type: 'counter' | 'counters' | 'group';
  deletedCounters: Counter[];
  counterPositions: [string, number][];
  deletedGroup?: Group;
  groupPosition?: number;
  reassignedCounterIds?: string[];
  originalGroupId?: string;
}

interface CounterState {
  counters: Counter[];
  groups: Group[];
  pendingDelete: PendingDelete | null;

  addCounter: (
    label: string,
    groupId: string,
    settings: Counter['settings'],
    styling: Counter['styling'],
  ) => void;
  updateCounter: (id: string, updates: Partial<Counter>) => void;
  increment: (id: string, amount: number) => void;
  resetCounter: (id: string) => void;
  deleteCounter: (id: string) => void;
  deleteCounters: (ids: Set<string>) => void;
  softDeleteCounter: (id: string) => void;
  softDeleteCounters: (ids: Set<string>) => void;
  softDeleteGroup: (id: string) => void;
  undoDelete: () => void;
  commitDelete: () => void;
  duplicateCounter: (id: string) => void;
  reorderCounters: (groupId: string, orderedIds: string[]) => void;
  clearHistory: (id: string) => void;
  deleteAll: () => void;
  addGroup: (name: string, icon?: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (orderedIds: string[]) => void;
}

export const useCounterShop = create<CounterState>()(
  persist(
    (set, get) => ({
      counters: [],
      groups: [DefaultGroup],
      pendingDelete: null as PendingDelete | null,

      addCounter: (
        label: string,
        groupId: string,
        settings: Counter['settings'],
        styling: Counter['styling'],
      ) =>
        set((state) => ({
          counters: [
            ...state.counters,
            {
              id: uuid(),
              label,
              count: 0,
              history: [{ type: HistoryAction.Creation, timestamp: Date.now() }],
              groupId: groupId ?? DefaultGroup.id,
              settings: settings ?? {
                defaultValue: 0,
                incrementBy: 1,
                decrementBy: 1,
                allowNegative: false,
              },
              styling: styling,
            },
          ],
        })),

      updateCounter: (id, updates) =>
        set((state) => ({
          counters: state.counters.map((counter) => {
            if (counter.id !== id) return counter;

            const changes: { field: string; from: string; to: string }[] = [];

            if (updates.styling) {
              const s = counter.styling;
              const u = updates.styling;
              if (u.color !== undefined && u.color !== s.color)
                changes.push({ field: 'Color', from: s.color, to: u.color });
              if ((u.icon ?? '') !== (s.icon ?? ''))
                changes.push({
                  field: 'Icon',
                  from: s.icon ?? 'none',
                  to: u.icon ?? 'none',
                });
            }

            if (updates.label !== undefined && updates.label !== counter.label)
              changes.push({
                field: 'Name',
                from: counter.label,
                to: updates.label,
              });

            if (updates.count !== undefined && updates.count !== counter.count)
              changes.push({
                field: 'Value',
                from: String(counter.count),
                to: String(updates.count),
              });

            if (updates.settings) {
              const s = counter.settings;
              const u = updates.settings;
              if (
                u.defaultValue !== undefined &&
                u.defaultValue !== s.defaultValue
              )
                changes.push({
                  field: 'Default value',
                  from: String(s.defaultValue),
                  to: String(u.defaultValue),
                });
              if (
                u.incrementBy !== undefined &&
                u.incrementBy !== s.incrementBy
              )
                changes.push({
                  field: 'Increment by',
                  from: String(s.incrementBy),
                  to: String(u.incrementBy),
                });
              if (
                u.decrementBy !== undefined &&
                u.decrementBy !== s.decrementBy
              )
                changes.push({
                  field: 'Decrement by',
                  from: String(s.decrementBy),
                  to: String(u.decrementBy),
                });
              if (u.minValue !== s.minValue)
                changes.push({
                  field: 'Min value',
                  from: s.minValue != null ? String(s.minValue) : 'off',
                  to: u.minValue != null ? String(u.minValue) : 'off',
                });
              if (u.maxValue !== s.maxValue)
                changes.push({
                  field: 'Max value',
                  from: s.maxValue != null ? String(s.maxValue) : 'off',
                  to: u.maxValue != null ? String(u.maxValue) : 'off',
                });
            }

            const updated = {
              ...counter,
              ...updates,
              settings: updates.settings
                ? { ...counter.settings, ...updates.settings }
                : counter.settings,
              styling: updates.styling
                ? { ...counter.styling, ...updates.styling }
                : counter.styling,
            };

            if (changes.length > 0) {
              updated.history = [
                ...counter.history,
                {
                  type: HistoryAction.SettingsChange,
                  timestamp: Date.now(),
                  changes,
                },
              ];
            }

            return updated;
          }),
        })),

      increment: (id, amount) =>
        set((state) => ({
          counters: state.counters.map((counter) => {
            if (counter.id !== id) return counter;
            let newValue = counter.count + amount;
            if (counter.settings.minValue != null)
              newValue = Math.max(newValue, counter.settings.minValue);
            if (counter.settings.maxValue != null)
              newValue = Math.min(newValue, counter.settings.maxValue);
            return {
              ...counter,
              count: newValue,
              history: [
                ...counter.history,
                {
                  type: HistoryAction.Increment,
                  timestamp: Date.now(),
                  details: {
                    incrementBy: amount,
                    valueBefore: counter.count,
                    valueAfter: newValue,
                  },
                },
              ],
            };
          }),
        })),

      resetCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  count: c.settings.defaultValue,
                  history: [
                    ...c.history,
                    { type: HistoryAction.Reset, timestamp: Date.now() },
                  ],
                }
              : c,
          ),
        })),

      deleteCounter: (id) =>
        set((state) => ({
          counters: state.counters.filter((c) => c.id !== id),
        })),

      deleteCounters: (ids) =>
        set((state) => ({
          counters: state.counters.filter((c) => !ids.has(c.id)),
        })),

      softDeleteCounter: (id) => {
        if (get().pendingDelete) set({ pendingDelete: null });
        set((state) => {
          const idx = state.counters.findIndex((c) => c.id === id);
          if (idx === -1) return {};
          return {
            pendingDelete: {
              type: 'counter',
              deletedCounters: [{ ...state.counters[idx] }],
              counterPositions: [[id, idx]],
            },
            counters: state.counters.filter((c) => c.id !== id),
          };
        });
      },

      softDeleteCounters: (ids) => {
        if (get().pendingDelete) set({ pendingDelete: null });
        set((state) => {
          const positions: [string, number][] = [];
          const deleted: Counter[] = [];
          state.counters.forEach((c, i) => {
            if (ids.has(c.id)) {
              positions.push([c.id, i]);
              deleted.push({ ...c });
            }
          });
          if (deleted.length === 0) return {};
          return {
            pendingDelete: {
              type: 'counters',
              deletedCounters: deleted,
              counterPositions: positions,
            },
            counters: state.counters.filter((c) => !ids.has(c.id)),
          };
        });
      },

      softDeleteGroup: (id) => {
        if (get().pendingDelete) set({ pendingDelete: null });
        set((state) => {
          const groupIdx = state.groups.findIndex((g) => g.id === id);
          if (groupIdx === -1) return {};
          const group = state.groups[groupIdx];
          const reassignedIds = state.counters
            .filter((c) => c.groupId === id)
            .map((c) => c.id);
          return {
            pendingDelete: {
              type: 'group',
              deletedCounters: [],
              counterPositions: [],
              deletedGroup: { ...group },
              groupPosition: groupIdx,
              reassignedCounterIds: reassignedIds,
              originalGroupId: id,
            },
            groups: state.groups.filter((g) => g.id !== id),
            counters: state.counters.map((c) =>
              c.groupId === id ? { ...c, groupId: DefaultGroup.id } : c,
            ),
          };
        });
      },

      undoDelete: () =>
        set((state) => {
          const pd = state.pendingDelete;
          if (!pd) return {};

          if (pd.type === 'group') {
            const groups = [...state.groups];
            if (pd.deletedGroup) {
              const insertAt = Math.min(pd.groupPosition ?? groups.length, groups.length);
              groups.splice(insertAt, 0, pd.deletedGroup);
            }
            const reassignedSet = new Set(pd.reassignedCounterIds);
            return {
              pendingDelete: null,
              groups,
              counters: pd.originalGroupId
                ? state.counters.map((c) =>
                    reassignedSet.has(c.id)
                      ? { ...c, groupId: pd.originalGroupId! }
                      : c,
                  )
                : state.counters,
            };
          }

          // counter or counters
          const counters = [...state.counters];
          const toRestore = [...pd.deletedCounters]
            .map((c) => ({
              counter: c,
              index: pd.counterPositions.find(([cid]) => cid === c.id)?.[1] ?? counters.length,
            }))
            .sort((a, b) => a.index - b.index);

          for (const { counter, index } of toRestore) {
            const insertAt = Math.min(index, counters.length);
            counters.splice(insertAt, 0, counter);
          }

          return { pendingDelete: null, counters };
        }),

      commitDelete: () => set({ pendingDelete: null }),

      duplicateCounter: (id) =>
        set((state) => {
          const { duplication } = useSettingsShop.getState();
          const idx = state.counters.findIndex((c) => c.id === id);
          if (idx === -1) return {};
          const source = state.counters[idx];
          const duplicate: Counter = {
            ...source,
            id: uuid(),
            history: duplication.copyHistory
              ? [...source.history]
              : [{ type: HistoryAction.Creation, timestamp: Date.now() }],
          };
          const counters = [...state.counters];
          if (duplication.insertAfterOriginal) {
            counters.splice(idx + 1, 0, duplicate);
          } else {
            const lastGroupIdx = counters
              .map((c, i) => (c.groupId === source.groupId ? i : -1))
              .filter((i) => i !== -1)
              .pop()!;
            counters.splice(lastGroupIdx + 1, 0, duplicate);
          }
          return { counters };
        }),

      reorderCounters: (groupId: string, orderedIds: string[]) =>
        set((state) => {
          const counters = [...state.counters];
          const groupIndices = counters
            .map((c, i) => (c.groupId === groupId ? i : -1))
            .filter((i) => i !== -1);
          const reordered = orderedIds
            .map((id) => counters.find((c) => c.id === id))
            .filter(Boolean) as Counter[];
          groupIndices.forEach((storeIndex, i) => {
            counters[storeIndex] = reordered[i];
          });
          return { counters };
        }),

      clearHistory: (id) =>
        set((state) => ({
          counters: state.counters.map((c) =>
            c.id === id
              ? {
                  ...c,
                  history: [{ type: HistoryAction.Creation, timestamp: Date.now() }],
                }
              : c,
          ),
        })),

      deleteAll: () =>
        set(() => ({
          counters: [],
        })),

      addGroup: (name, icon) =>
        set((state) => ({
          groups: [...state.groups, { id: uuid(), name, styling: { icon } }],
        })),

      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group,
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

      reorderGroups: (orderedIds) =>
        set((state) => {
          const defaultGroup = state.groups[0];
          const reordered = orderedIds
            .map((id) => state.groups.find((g) => g.id === id))
            .filter(Boolean) as Group[];
          return { groups: [defaultGroup, ...reordered] };
        }),
    }),
    {
      name: 'counter-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        counters: state.counters,
        groups: state.groups,
      }),
    },
  ),
);
