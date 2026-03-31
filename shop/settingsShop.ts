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

  updateDuplicationSettings: (
    updates: Partial<SettingsState['duplication']>,
  ) => void;
}

export const useSettingsShop = create<SettingsState>()(
  persist(
    (set) => ({
      duplication: {
        insertAfterOriginal: true,
        copyHistory: false,
      },

      updateDuplicationSettings: (updates) =>
        set((state) => ({
          duplication: { ...state.duplication, ...updates },
        })),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
