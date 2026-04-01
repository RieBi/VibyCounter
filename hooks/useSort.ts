import { useSettingsShop } from '@/shop/settingsShop';
import { SortDirection, SortField } from '@/vibes/definitions';
import { useState } from 'react';

export function useSort() {
  const sortField = useSettingsShop((s) => s.sort.field);
  const sortDirection = useSettingsShop((s) => s.sort.direction);
  const updateSortSettings = useSettingsShop((s) => s.updateSortSettings);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const isManualOrder = sortField === 'manual';

  return {
    sortField,
    sortDirection,
    sortModalVisible,
    isManualOrder,
    setSortField: (field: SortField) => updateSortSettings({ field }),
    setSortDirection: (direction: SortDirection) =>
      updateSortSettings({ direction }),
    setSortModalVisible,
  };
}
