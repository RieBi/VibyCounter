import { useCounterShop } from '@/shop/counterShop';
import { Counter } from '@/vibes/definitions';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

export type UseSelectionOptions = {
  onBulkDeleteNoneUnlocked?: () => void;
  onBulkDeleteSkippedLocked?: (payload: {
    deletedCount: number;
    skippedLocked: number;
  }) => void;
};

export function useSelection(options?: UseSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const selecting = selectedIds.size > 0;
  const softDeleteCounters = useCounterShop((state) => state.softDeleteCounters);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAll = (counters: Counter[]) => {
    setSelectedIds(new Set(counters.map((c) => c.id)));
  };

  const handleDeleteSelected = () => {
    const counters = useCounterShop.getState().counters;
    const selected = [...selectedIds];
    const unlockedIds = selected.filter((id) => {
      const c = counters.find((x) => x.id === id);
      return c && !c.locked;
    });
    const skippedLocked = selected.length - unlockedIds.length;

    if (unlockedIds.length === 0) {
      setConfirmDeleteVisible(false);
      options?.onBulkDeleteNoneUnlocked?.();
      return;
    }

    softDeleteCounters(new Set(unlockedIds));
    clearSelection();
    setConfirmDeleteVisible(false);

    if (skippedLocked > 0) {
      options?.onBulkDeleteSkippedLocked?.({
        deletedCount: unlockedIds.length,
        skippedLocked,
      });
    }
  };

  useEffect(() => {
    if (!selecting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      clearSelection();
      return true;
    });
    return () => sub.remove();
  }, [selecting]);

  return {
    selectedIds,
    selecting,
    moveIds,
    setMoveIds,
    confirmDeleteVisible,
    setConfirmDeleteVisible,
    toggleSelect,
    clearSelection,
    selectAll,
    handleDeleteSelected,
  };
}
