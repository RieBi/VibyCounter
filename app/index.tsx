import ActionsPopup from '@/components/ActionsPopup';
import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import GroupDrawer from '@/components/GroupDrawer';
import MoveToGroupModal from '@/components/MoveToGroupModal';
import ConfirmModal from '@/components/reusable/ConfirmModal';
import VibyInput from '@/components/reusable/VibyInput';
import { useCounterShop } from '@/shop/counterShop';
import { Counter, DefaultGroup } from '@/vibes/definitions';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ReorderableList, {
  ReorderableListReorderEvent,
  reorderItems,
} from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    DefaultGroup.id,
  );
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [actionsPos, setActionsPos] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const searchAnim = useSharedValue(0);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasSearched = useRef(false);

  const counterObjects = useCounterShop(
    useShallow((state) =>
      state.counters
        .filter((c) => c.groupId === selectedGroupId)
        .filter((c) =>
          searchQuery.trim() === ''
            ? true
            : c.label.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ),
  );

  const selectedGroup = useCounterShop(
    (state) => state.groups.filter((g) => g.id === selectedGroupId)[0],
  );

  const reorderCounters = useCounterShop((state) => state.reorderCounters);

  const [localCounters, setLocalCounters] = useState(counterObjects);

  useEffect(() => {
    setLocalCounters(counterObjects);
  }, [counterObjects]);

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

  const didMoveCounter = useSharedValue(false);

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

  const closeSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
    searchAnim.value = withTiming(0, { duration: 200 });
    setTimeout(() => setSearching(false), 200);
  }, [searchAnim]);

  useEffect(() => {
    if (!searching) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSearch();
      return true;
    });

    return () => sub.remove();
  }, [closeSearch, searching]);

  const openSearch = () => {
    hasSearched.current = true;
    setSearching(true);
    searchAnim.value = withTiming(1, { duration: 200 });
  };

  const titleStyle = useAnimatedStyle(() => ({
    opacity: 1 - searchAnim.value,
    transform: [{ translateX: -searchAnim.value * 50 }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: searchAnim.value,
    transform: [{ translateX: (1 - searchAnim.value) * 50 }],
  }));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selecting = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const deleteCounter = useCounterShop((state) => state.deleteCounter);

  const selectAll = () => {
    setSelectedIds(new Set(localCounters.map((c) => c.id)));
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => deleteCounter(id));
    clearSelection();
    setConfirmDeleteSelected(false);
  };

  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);

  useEffect(() => {
    if (!selecting) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      clearSelection();
      return true;
    });

    return () => sub.remove();
  }, [selecting]);

  const renderCounter = useCallback(
    ({ item }: { item: Counter }) => (
      <CounterCard
        counterId={item.id}
        onEdit={() => setEditingId(item.id)}
        onActions={(id, pos) => {
          setActionsId(id);
          setActionsPos(pos);
        }}
        reorderable={searchQuery.trim() === ''}
        selected={selectedIds.has(item.id)}
        selecting={selecting}
        onSelect={() => toggleSelect(item.id)}
        didMove={didMoveCounter}
      />
    ),
    [searchQuery, selecting, selectedIds, didMoveCounter],
  );

  const insets = useSafeAreaInsets();

  return (
    <View
      className='flex-1 justify-center bg-white'
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar style='dark' />
      <View className='flex-1'>
        <View className='flex-row items-center p-2 gap-3 h-14'>
          {selecting ? (
            <View className='flex-1 flex-row items-center gap-3'>
              <TouchableOpacity
                className='bg-zinc-100 p-2 rounded-xl'
                onPress={clearSelection}
              >
                <MaterialIcons name='arrow-back' size={22} color='#3f3f46' />
              </TouchableOpacity>
              <View className='flex-1 flex-row items-center justify-between bg-zinc-100 px-4 py-2 rounded-xl'>
                <Text
                  className='flex-1 font-semibold text-lg text-zinc-700'
                  style={{ lineHeight: 18 }}
                >
                  {selectedIds.size} selected
                </Text>
                <View className='flex-row items-center gap-4'>
                  <TouchableOpacity onPress={selectAll}>
                    <MaterialIcons
                      name='select-all'
                      size={22}
                      color='#71717a'
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setMoveIds([...selectedIds]);
                    }}
                  >
                    <MaterialIcons
                      name='drive-file-move-outline'
                      size={22}
                      color='#71717a'
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setConfirmDeleteSelected(true)}
                  >
                    <MaterialIcons
                      name='delete-outline'
                      size={22}
                      color='#ef4444'
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : searching ? (
            <Animated.View
              style={searchStyle}
              className='flex-1 flex-row items-center bg-zinc-100 rounded-xl px-2'
            >
              <TouchableOpacity onPress={closeSearch} className='p-1'>
                <MaterialIcons name='arrow-back' size={22} color='#71717a' />
              </TouchableOpacity>
              <VibyInput
                className='flex-1 text-zinc-800 p-2 text-base'
                placeholder='Search counters...'
                placeholderTextColor='#a1a1aa'
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectTextOnFocus={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className='p-1'
                >
                  <MaterialIcons name='close' size={22} color='#71717a' />
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            <Animated.View
              style={hasSearched.current ? titleStyle : undefined}
              className='flex-1 flex-row items-center gap-3'
            >
              <TouchableOpacity
                className='bg-zinc-100 p-2 rounded-xl'
                onPress={() => setDrawerVisible(true)}
              >
                <AntDesign name='menu' size={22} color='#3f3f46' />
              </TouchableOpacity>

              <View className='flex-1 flex-row items-center bg-zinc-100 px-4 py-2 rounded-xl'>
                {selectedGroup.styling?.icon && (
                  <MaterialIcons
                    name={
                      selectedGroup.styling
                        .icon as keyof typeof MaterialIcons.glyphMap
                    }
                    size={18}
                    color='#52525b'
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  className='flex-1 font-semibold text-lg text-zinc-700'
                  numberOfLines={1}
                  style={{ lineHeight: 18 }}
                >
                  {selectedGroup.name}
                </Text>
                <TouchableOpacity onPress={openSearch}>
                  <MaterialIcons name='search' size={22} color='#71717a' />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
        <ReorderableList
          data={localCounters}
          keyExtractor={(item) => item.id}
          renderItem={renderCounter}
          onReorder={handleCounterReorder}
          panGesture={counterListPanGesture}
          dragEnabled={searchQuery.trim() === ''}
          ListFooterComponent={<View className='h-20' />}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <Text className='text-zinc-400 text-center mt-8'>
                No counters matching &quot;{searchQuery}&quot;
              </Text>
            ) : null
          }
        />
        <View className='absolute right-6 bottom-6'>
          <AddCounterModal selectedGroupId={selectedGroupId}></AddCounterModal>
        </View>
        <EditCounterModal
          counterId={editingId}
          onClose={() => setEditingId(null)}
        />
        <ActionsPopup
          visible={!!actionsId}
          position={actionsPos}
          onMoveTo={() => {
            if (!actionsId) {
              return;
            }

            setMoveIds([actionsId]);
            setActionsId(null);
          }}
          onClose={() => setActionsId(null)}
        />
        <MoveToGroupModal
          counterIds={moveIds}
          visible={moveIds.length > 0}
          onClose={() => setMoveIds([])}
        />
        <ConfirmModal
          visible={confirmDeleteSelected}
          title='Delete Counters'
          message={`Are you sure you want to delete ${selectedIds.size} counter${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDeleteSelected(false)}
        />
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
