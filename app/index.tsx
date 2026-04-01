import ActionsPopup from '@/components/ActionsPopup';
import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import GroupDrawer from '@/components/GroupDrawer';
import IndexHeader from '@/components/IndexHeader';
import MoveToGroupModal from '@/components/MoveToGroupModal';
import ConfirmModal from '@/components/reusable/ConfirmModal';
import SortModal from '@/components/SortModal';
import { useSearch } from '@/hooks/useSearch';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import { useCounterShop } from '@/shop/counterShop';
import { Counter, DefaultGroup, sortCounters } from '@/vibes/definitions';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
} from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const insets = useSafeAreaInsets();

  // --- Group ---
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    DefaultGroup.id,
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const selectedGroup = useCounterShop(
    (state) => state.groups.find((g) => g.id === selectedGroupId)!,
  );

  // --- Search ---
  const {
    searching,
    searchQuery,
    setSearchQuery,
    searchAnim,
    hasSearched,
    openSearch,
    closeSearch,
  } = useSearch();

  // --- Sort ---
  const {
    sortField,
    sortDirection,
    sortModalVisible,
    isManualOrder,
    setSortField,
    setSortDirection,
    setSortModalVisible,
  } = useSort();

  // --- Selection ---
  const {
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
  } = useSelection();

  // --- Counter list ---
  const counterObjects = useCounterShop(
    useShallow((state) => {
      const filtered = state.counters
        .filter((c) => c.groupId === selectedGroupId)
        .filter((c) =>
          searchQuery.trim() === ''
            ? true
            : c.label.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return sortCounters(filtered, sortField, sortDirection);
    }),
  );

  const [localCounters, setLocalCounters] = useState(counterObjects);
  useEffect(() => {
    setLocalCounters(counterObjects);
  }, [counterObjects]);

  // --- Reordering ---
  const reorderCounters = useCounterShop((state) => state.reorderCounters);
  const duplicateCounter = useCounterShop((state) => state.duplicateCounter);
  const didMoveCounter = useSharedValue(true);
  const reorderable = searchQuery.trim() === '' && isManualOrder && !selecting;

  const handleCounterReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      const reordered = reorderItems(localCounters, from, to);
      setLocalCounters(reordered);
      reorderCounters(
        selectedGroupId,
        reordered.map((c) => c.id),
      );
    },
    [localCounters, reorderCounters, selectedGroupId],
  );

  const counterListPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart(() => {
          'worklet';
          didMoveCounter.value = true;
        }),
    [didMoveCounter],
  );

  // --- Actions popup ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [actionsPos, setActionsPos] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // --- Render counter item ---
  const renderCounter = useCallback(
    ({ item }: { item: Counter }) => (
      <CounterCard
        counterId={item.id}
        onEdit={() => setEditingId(item.id)}
        onActions={(id, pos) => {
          setActionsId(id);
          setActionsPos(pos);
        }}
        reorderable={reorderable}
        selected={selectedIds.has(item.id)}
        selecting={selecting}
        onSelect={() => toggleSelect(item.id)}
        didMove={didMoveCounter}
      />
    ),
    [reorderable, selectedIds, selecting, didMoveCounter, toggleSelect],
  );

  return (
    <View
      className='flex-1 justify-center bg-white'
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style='dark' />
      <View className='flex-1'>
        {/* === Header === */}
        <IndexHeader
          selecting={selecting}
          selectedCount={selectedIds.size}
          onClearSelection={clearSelection}
          onSelectAll={() => selectAll(localCounters)}
          onMoveSelected={() => setMoveIds([...selectedIds])}
          onDeleteSelected={() => setConfirmDeleteVisible(true)}
          searching={searching}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchAnim={searchAnim}
          hasSearched={hasSearched}
          onOpenSearch={openSearch}
          onCloseSearch={closeSearch}
          selectedGroup={selectedGroup}
          isManualOrder={isManualOrder}
          onOpenDrawer={() => setDrawerVisible(true)}
          onOpenSort={() => setSortModalVisible(true)}
        />

        {/* === Counter List === */}
        <ReorderableList
          data={localCounters}
          keyExtractor={(item) => item.id}
          renderItem={renderCounter}
          onReorder={handleCounterReorder}
          panGesture={counterListPanGesture}
          dragEnabled={reorderable}
          ListFooterComponent={<View className='h-20' />}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <Text className='text-zinc-400 text-center mt-8'>
                No counters matching &quot;{searchQuery}&quot;
              </Text>
            ) : (
              <Text className='text-zinc-400 text-center mt-8'>
                Tap + to add your first counter
              </Text>
            )
          }
        />

        {/* === Add Counter FAB === */}
        <View className='absolute right-6 bottom-6'>
          <AddCounterModal selectedGroupId={selectedGroupId} />
        </View>

        {/* === Modals === */}
        <EditCounterModal
          counterId={editingId}
          onClose={() => setEditingId(null)}
        />
        <ActionsPopup
          visible={!!actionsId}
          position={actionsPos}
          onMoveTo={() => {
            if (!actionsId) return;
            setMoveIds([actionsId]);
            setActionsId(null);
          }}
          onDuplicate={() => {
            if (!actionsId) return;
            duplicateCounter(actionsId);
            setActionsId(null);
          }}
          onClose={() => setActionsId(null)}
        />
        <MoveToGroupModal
          counterIds={moveIds}
          visible={moveIds.length > 0}
          onClose={() => {
            setMoveIds([]);
            clearSelection();
          }}
        />
        <ConfirmModal
          visible={confirmDeleteVisible}
          title='Delete Counters'
          message={`Are you sure you want to delete ${selectedIds.size} counter${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDeleteVisible(false)}
        />
        <SortModal
          visible={sortModalVisible}
          field={sortField}
          direction={sortDirection}
          onSelect={(f, d) => {
            setSortField(f);
            setSortDirection(d);
          }}
          onClose={() => setSortModalVisible(false)}
        />

        {/* === Drawer (rendered last for z-order) === */}
        <GroupDrawer
          visible={drawerVisible}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onClose={() => setDrawerVisible(false)}
        />
      </View>
    </View>
  );
}
