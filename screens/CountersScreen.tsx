import ActionsPopup from '@/components/ActionsPopup';
import AddCounterModal from '@/components/AddCounterModal';
import SwipeableCounterCard from '@/components/SwipeableCounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import GroupDrawer from '@/components/GroupDrawer';
import IndexHeader from '@/components/IndexHeader';
import MoveToGroupModal from '@/components/MoveToGroupModal';
import ConfirmModal from '@/components/reusable/ConfirmModal';
import MessageModal from '@/components/reusable/MessageModal';
import UndoToast from '@/components/reusable/UndoToast';
import SortModal from '@/components/SortModal';
import { useSearch } from '@/hooks/useSearch';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import { PendingDelete, useCounterShop } from '@/shop/counterShop';
import { Counter, DefaultGroup, sortCounters } from '@/vibes/definitions';
import { shareExportPayload } from '@/vibes/importExport';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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

function getUndoMessage(pd: PendingDelete): string {
  switch (pd.type) {
    case 'counter':
      return `"${pd.deletedCounters[0]?.label}" deleted`;
    case 'counters':
      return `${pd.deletedCounters.length} counters deleted`;
    case 'group':
      return `Group "${pd.deletedGroup?.name}" deleted`;
  }
}

export default function CountersScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

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
  const buildCounterExportPayload = useCounterShop(
    (state) => state.buildCounterExportPayload,
  );
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

  // --- Empty group prompt ---
  const [emptyGroupId, setEmptyGroupId] = useState<string | null>(null);

  // --- Undo ---
  const pendingDelete = useCounterShop((state) => state.pendingDelete);
  const softDeleteCounter = useCounterShop((state) => state.softDeleteCounter);
  const softDeleteGroup = useCounterShop((state) => state.softDeleteGroup);
  const undoDelete = useCounterShop((state) => state.undoDelete);
  const commitDelete = useCounterShop((state) => state.commitDelete);

  // --- Swipe actions ---
  const [swipeDeleteId, setSwipeDeleteId] = useState<string | null>(null);
  const handleSwipeDelete = useCallback(
    (id: string) => setSwipeDeleteId(id),
    [],
  );
  const handleSwipeMove = useCallback(
    (id: string) => setMoveIds([id]),
    [setMoveIds],
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Render counter item ---
  const renderCounter = useCallback(
    ({ item }: { item: Counter }) => (
      <SwipeableCounterCard
        counterId={item.id}
        onEdit={() => setEditingId(item.id)}
        onActions={(
          id: string,
          pos: { x: number; y: number; width: number; height: number },
        ) => {
          setActionsId(id);
          setActionsPos(pos);
        }}
        reorderable={reorderable}
        selected={selectedIds.has(item.id)}
        selecting={selecting}
        onSelect={() => toggleSelect(item.id)}
        didMove={didMoveCounter}
        onSwipeDelete={handleSwipeDelete}
        onSwipeMove={handleSwipeMove}
        swipeEnabled={!selecting}
        pendingSwipeAction={swipeDeleteId === item.id || moveIds.includes(item.id)}
      />
    ),
    [
      reorderable,
      selectedIds,
      selecting,
      didMoveCounter,
      toggleSelect,
      handleSwipeDelete,
      handleSwipeMove,
      swipeDeleteId,
      moveIds,
    ],
  );

  return (
    <View
      className='flex-1 justify-center bg-white'
      style={{ paddingTop: insets.top }}
    >
      <StatusBar style='dark' />
      <View className='flex-1'>
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

        <ReorderableList
          data={localCounters}
          keyExtractor={(item) => item.id}
          renderItem={renderCounter}
          onReorder={handleCounterReorder}
          panGesture={counterListPanGesture}
          dragEnabled={reorderable}
          ListFooterComponent={<View style={{ height: tabBarHeight + 20 }} />}
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

        <View style={{ position: 'absolute', right: 24, bottom: 12 }}>
          <AddCounterModal selectedGroupId={selectedGroupId} />
        </View>

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
          onExport={async () => {
            if (!actionsId) return;
            const payload = buildCounterExportPayload(actionsId);
            setActionsId(null);
            if (!payload) return;
            try {
              await shareExportPayload(payload);
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : 'Unable to export counter.',
              );
            }
          }}
          onClose={() => setActionsId(null)}
        />
        <MessageModal
          visible={!!errorMessage}
          title='Export failed'
          message={errorMessage ?? ''}
          onPrimary={() => setErrorMessage(null)}
        />
        <ConfirmModal
          visible={!!swipeDeleteId}
          title='Delete Counter'
          message='Delete this counter?'
          onConfirm={() => {
            if (swipeDeleteId) softDeleteCounter(swipeDeleteId);
            setSwipeDeleteId(null);
          }}
          onCancel={() => setSwipeDeleteId(null)}
        />
        <MoveToGroupModal
          counterIds={moveIds}
          visible={moveIds.length > 0}
          sourceGroupId={selectedGroupId}
          onGroupEmptied={setEmptyGroupId}
          onClose={() => {
            setMoveIds([]);
            clearSelection();
          }}
        />
        <ConfirmModal
          visible={!!emptyGroupId}
          title='Delete Empty Group'
          message='This group has no counters left. Delete it?'
          onConfirm={() => {
            if (emptyGroupId) {
              softDeleteGroup(emptyGroupId);
              setSelectedGroupId(DefaultGroup.id);
            }
            setEmptyGroupId(null);
          }}
          onCancel={() => setEmptyGroupId(null)}
        />
        <ConfirmModal
          visible={confirmDeleteVisible}
          title='Delete Counters'
          message={`Are you sure you want to delete ${selectedIds.size} counter${selectedIds.size > 1 ? 's' : ''}?`}
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

        <GroupDrawer
          visible={drawerVisible}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onClose={() => setDrawerVisible(false)}
        />

        <UndoToast
          message={pendingDelete ? getUndoMessage(pendingDelete) : null}
          onUndo={undoDelete}
          onDismiss={commitDelete}
        />
      </View>
    </View>
  );
}
