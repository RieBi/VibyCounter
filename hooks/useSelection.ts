import { useCounterShop } from '@/shop/counterShop';
import { Counter } from '@/vibes/definitions';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const selecting = selectedIds.size > 0;
  const deleteCounters = useCounterShop((state) => state.deleteCounters);

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
    deleteCounters(selectedIds);
    clearSelection();
    setConfirmDeleteVisible(false);
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
