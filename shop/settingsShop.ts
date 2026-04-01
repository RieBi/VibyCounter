import { SortDirection, SortField } from '@/vibes/definitions';
import { createMMKV } from 'react-native-mmkv';
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

interface SettingsState {
  duplication: {
    insertAfterOriginal: boolean;
    copyHistory: boolean;
  };
  sort: {
    field: SortField;
    direction: SortDirection;
  };

  updateDuplicationSettings: (
    updates: Partial<SettingsState['duplication']>,
  ) => void;
  updateSortSettings: (updates: Partial<SettingsState['sort']>) => void;
}

export const useSettingsShop = create<SettingsState>()(
  persist(
    (set) => ({
      duplication: {
        insertAfterOriginal: true,
        copyHistory: false,
      },
      sort: {
        field: 'manual',
        direction: 'asc',
      },

      updateDuplicationSettings: (updates) =>
        set((state) => ({
          duplication: { ...state.duplication, ...updates },
        })),
      updateSortSettings: (updates) =>
        set((state) => ({
          sort: { ...state.sort, ...updates },
        })),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
