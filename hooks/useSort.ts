import { SortDirection, SortField } from '@/vibes/definitions';
import { useState } from 'react';

export function useSort() {
  const [sortField, setSortField] = useState<SortField>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const isManualOrder = sortField === 'manual';

  return {
    sortField,
    sortDirection,
    sortModalVisible,
    isManualOrder,
    setSortField,
    setSortDirection,
    setSortModalVisible,
  };
}
