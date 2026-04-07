import { useSettingsShop } from '@/shop/settingsShop';
import {
  appendHistoryEntry,
  clearHistoryEntries,
  deleteHistoryForCounter,
  deleteHistoryForCounters,
  duplicateCounterHistory,
  getHistoryEntriesForCounters,
  HistoryExportRecord,
  replaceAllHistoryEntries,
} from '@/data/historyDb';
import {
  AllExportPayload,
  CounterExportPayload,
  GroupExportPayload,
  ImportMode,
  VibyExportPayload,
} from '@/vibes/importExport';
import {
  Counter,
  DefaultGroup,
  Group,
  HistoryAction,
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

export interface PendingDelete {
  type: 'counter' | 'counters' | 'group';
  deletedCounters: Counter[];
  counterPositions: [string, number][];
  deletedGroup?: Group;
  groupPosition?: number;
  reassignedCounterIds?: string[];
  originalGroupId?: string;
}

export interface ImportSummary {
  scope: VibyExportPayload['scope'];
  groups: number;
  counters: number;
  historyEntries: number;
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
  buildCounterExportPayload: (counterId: string) => CounterExportPayload | null;
  buildGroupExportPayload: (groupId: string) => GroupExportPayload | null;
  buildAllExportPayload: () => AllExportPayload;
  applyImportedPayload: (
    payload: VibyExportPayload,
    mode: ImportMode,
  ) => ImportSummary;
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
      ) => {
        const now = Date.now();
        const newId = uuid();
        set((state) => ({
          counters: [
            ...state.counters,
            {
              id: newId,
              label,
              count: 0,
              createdAt: now,
              lastActionAt: now,
              historyCount: 1,
              groupId: groupId ?? DefaultGroup.id,
              settings: settings ?? {
                defaultValue: 0,
                incrementBy: 1,
                decrementBy: 1,
              },
              styling: styling,
            },
          ],
        }));
        appendHistoryEntry(newId, {
          type: HistoryAction.Creation,
          timestamp: now,
        });
      },

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
              if (u.goal !== s.goal)
                changes.push({
                  field: 'Goal',
                  from: s.goal != null ? String(s.goal) : 'none',
                  to: u.goal != null ? String(u.goal) : 'none',
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
              const now = Date.now();
              updated.lastActionAt = now;
              updated.historyCount = counter.historyCount + 1;
              appendHistoryEntry(counter.id, {
                type: HistoryAction.SettingsChange,
                timestamp: now,
                changes,
              });
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
            const now = Date.now();
            appendHistoryEntry(counter.id, {
              type: HistoryAction.Increment,
              timestamp: now,
              valueBefore: counter.count,
              valueAfter: newValue,
              delta: amount,
            });
            return {
              ...counter,
              count: newValue,
              lastActionAt: now,
              historyCount: counter.historyCount + 1,
            };
          }),
        })),

      resetCounter: (id) =>
        set((state) => ({
          counters: state.counters.map((c) => {
            if (c.id !== id) return c;
            const now = Date.now();
            appendHistoryEntry(c.id, {
              type: HistoryAction.Reset,
              timestamp: now,
            });
            return {
              ...c,
              count: c.settings.defaultValue,
              lastActionAt: now,
              historyCount: c.historyCount + 1,
            };
          }),
        })),

      deleteCounter: (id) =>
        set((state) => {
          deleteHistoryForCounter(id);
          return {
            counters: state.counters.filter((c) => c.id !== id),
          };
        }),

      deleteCounters: (ids) =>
        set((state) => {
          deleteHistoryForCounters([...ids]);
          return {
            counters: state.counters.filter((c) => !ids.has(c.id)),
          };
        }),

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
              const insertAt = Math.min(
                pd.groupPosition ?? groups.length,
                groups.length,
              );
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
              index:
                pd.counterPositions.find(([cid]) => cid === c.id)?.[1] ??
                counters.length,
            }))
            .sort((a, b) => a.index - b.index);

          for (const { counter, index } of toRestore) {
            const insertAt = Math.min(index, counters.length);
            counters.splice(insertAt, 0, counter);
          }

          return { pendingDelete: null, counters };
        }),

      commitDelete: () =>
        set((state) => {
          const pending = state.pendingDelete;
          if (pending?.type === 'counter' || pending?.type === 'counters') {
            deleteHistoryForCounters(pending.deletedCounters.map((c) => c.id));
          }
          return { pendingDelete: null };
        }),

      duplicateCounter: (id) =>
        set((state) => {
          const { duplication } = useSettingsShop.getState();
          const idx = state.counters.findIndex((c) => c.id === id);
          if (idx === -1) return {};
          const source = state.counters[idx];
          const now = Date.now();
          const duplicateId = uuid();
          const duplicate: Counter = {
            ...source,
            id: duplicateId,
            createdAt: now,
            lastActionAt: now,
            historyCount: duplication.copyHistory ? source.historyCount : 1,
          };
          if (duplication.copyHistory) {
            duplicateCounterHistory(source.id, duplicateId);
          } else {
            appendHistoryEntry(duplicateId, {
              type: HistoryAction.Creation,
              timestamp: now,
            });
          }
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
          counters: state.counters.map((c) => {
            if (c.id !== id) return c;
            const now = Date.now();
            clearHistoryEntries(id);
            appendHistoryEntry(id, {
              type: HistoryAction.Creation,
              timestamp: now,
            });
            return {
              ...c,
              createdAt: now,
              lastActionAt: now,
              historyCount: 1,
            };
          }),
        })),

      deleteAll: () =>
        set((state) => {
          deleteHistoryForCounters(state.counters.map((c) => c.id));
          return {
            counters: [],
          };
        }),

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

      buildCounterExportPayload: (counterId) => {
        const state = get();
        const counter = state.counters.find((item) => item.id === counterId);
        if (!counter) return null;

        const group =
          state.groups.find((item) => item.id === counter.groupId) ?? DefaultGroup;
        const history = getHistoryEntriesForCounters([counterId]).map(
          (record) => record.entry,
        );

        return {
          format: 'viby-export',
          version: 1,
          exportedAt: Date.now(),
          scope: 'counter',
          data: {
            group: { ...group },
            counter: { ...counter },
            history,
          },
        };
      },

      buildGroupExportPayload: (groupId) => {
        const state = get();
        const group = state.groups.find((item) => item.id === groupId);
        if (!group) return null;

        const counters = state.counters.filter((item) => item.groupId === groupId);
        const history = getHistoryEntriesForCounters(counters.map((item) => item.id));

        return {
          format: 'viby-export',
          version: 1,
          exportedAt: Date.now(),
          scope: 'group',
          data: {
            group: { ...group },
            counters: counters.map((item) => ({ ...item })),
            history,
          },
        };
      },

      buildAllExportPayload: () => {
        const state = get();
        const history = getHistoryEntriesForCounters(
          state.counters.map((item) => item.id),
        );

        return {
          format: 'viby-export',
          version: 1,
          exportedAt: Date.now(),
          scope: 'all',
          data: {
            groups: state.groups.map((item) => ({ ...item })),
            counters: state.counters.map((item) => ({ ...item })),
            history,
          },
        };
      },

      applyImportedPayload: (payload, mode) => {
        const state = get();

        if (payload.scope === 'all' && mode === 'replace') {
          const seenGroups = new Set<string>();
          const groups: Group[] = [{ ...DefaultGroup }];

          for (const group of payload.data.groups) {
            if (!group?.id || seenGroups.has(group.id) || group.id === DefaultGroup.id) {
              continue;
            }
            seenGroups.add(group.id);
            groups.push({ ...group });
          }
          const groupIds = new Set(groups.map((group) => group.id));
          const counters = payload.data.counters.map((counter) => ({
            ...counter,
            groupId: groupIds.has(counter.groupId) ? counter.groupId : groups[0].id,
          }));

          const validCounterIds = new Set(counters.map((counter) => counter.id));
          const history = payload.data.history.filter((record) =>
            validCounterIds.has(record.counterId),
          );

          set({ groups, counters, pendingDelete: null });
          replaceAllHistoryEntries(history);

          return {
            scope: payload.scope,
            groups: groups.length,
            counters: counters.length,
            historyEntries: history.length,
          };
        }

        const groups = state.groups.map((item) => ({ ...item }));
        const counters = state.counters.map((item) => ({ ...item }));
        const idMap = new Map<string, string>();
        const existingGroupIds = new Set(groups.map((item) => item.id));
        const existingCounterIds = new Set(counters.map((item) => item.id));

        const ensureGroup = (group: Group) => {
          if (group.id === DefaultGroup.id) {
            idMap.set(group.id, DefaultGroup.id);
            return DefaultGroup.id;
          }
          if (!existingGroupIds.has(group.id)) {
            groups.push({ ...group });
            existingGroupIds.add(group.id);
            idMap.set(group.id, group.id);
            return group.id;
          }
          if (mode === 'replace') {
            const groupIndex = groups.findIndex((item) => item.id === group.id);
            if (groupIndex !== -1) groups[groupIndex] = { ...group };
            idMap.set(group.id, group.id);
            return group.id;
          }
          const remapped = uuid();
          groups.push({ ...group, id: remapped });
          existingGroupIds.add(remapped);
          idMap.set(group.id, remapped);
          return remapped;
        };

        const appendCounter = (counter: Counter) => {
          const mappedGroupId = idMap.get(counter.groupId) ?? DefaultGroup.id;
          const groupId = existingGroupIds.has(mappedGroupId)
            ? mappedGroupId
            : DefaultGroup.id;

          if (!existingCounterIds.has(counter.id)) {
            counters.push({ ...counter, groupId });
            existingCounterIds.add(counter.id);
            idMap.set(counter.id, counter.id);
            return counter.id;
          }
          if (mode === 'replace') {
            const counterIndex = counters.findIndex((item) => item.id === counter.id);
            if (counterIndex !== -1) counters[counterIndex] = { ...counter, groupId };
            idMap.set(counter.id, counter.id);
            return counter.id;
          }
          const remapped = uuid();
          counters.push({ ...counter, id: remapped, groupId });
          existingCounterIds.add(remapped);
          idMap.set(counter.id, remapped);
          return remapped;
        };

        let importedHistory: HistoryExportRecord[] = [];

        if (payload.scope === 'counter') {
          ensureGroup(payload.data.group);
          appendCounter(payload.data.counter);

          if (mode === 'replace') {
            deleteHistoryForCounter(payload.data.counter.id);
          }

          importedHistory = payload.data.history.map((entry) => ({
            counterId: payload.data.counter.id,
            entry,
          }));
        }

        if (payload.scope === 'group') {
          const targetGroupId = ensureGroup(payload.data.group);

          if (mode === 'replace') {
            const idsToReplace = counters
              .filter((item) => item.groupId === targetGroupId)
              .map((item) => item.id);
            if (idsToReplace.length > 0) {
              deleteHistoryForCounters(idsToReplace);
            }
            for (let index = counters.length - 1; index >= 0; index -= 1) {
              if (counters[index].groupId === targetGroupId) {
                existingCounterIds.delete(counters[index].id);
                counters.splice(index, 1);
              }
            }
          }

          for (const counter of payload.data.counters) {
            appendCounter(counter);
          }

          importedHistory = payload.data.history;
        }

        if (payload.scope === 'all') {
          for (const group of payload.data.groups) {
            ensureGroup(group);
          }
          for (const counter of payload.data.counters) {
            appendCounter(counter);
          }
          importedHistory = payload.data.history;
        }

        const history = importedHistory
          .map((record) => ({
            counterId: idMap.get(record.counterId) ?? record.counterId,
            entry: record.entry,
          }))
          .filter((record) => existingCounterIds.has(record.counterId));

        for (const record of history) {
          appendHistoryEntry(record.counterId, {
            type: record.entry.type,
            timestamp: record.entry.timestamp,
            valueBefore: record.entry.details?.valueBefore,
            valueAfter: record.entry.details?.valueAfter,
            delta: record.entry.details?.incrementBy,
            changes: record.entry.changes,
          });
        }

        set({ groups, counters, pendingDelete: null });

        const importedGroupCount =
          payload.scope === 'counter'
            ? 1
            : payload.scope === 'group'
              ? 1
              : payload.data.groups.length;
        const importedCounterCount =
          payload.scope === 'counter'
            ? 1
            : payload.scope === 'group'
              ? payload.data.counters.length
              : payload.data.counters.length;

        return {
          scope: payload.scope,
          groups: importedGroupCount,
          counters: importedCounterCount,
          historyEntries: history.length,
        };
      },
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
