import ActionsPopup from '@/components/ActionsPopup';
import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import GroupDrawer from '@/components/GroupDrawer';
import MoveToGroupModal from '@/components/MoveToGroupModal';
import VibyInput from '@/components/reusable/VibyInput';
import { useCounterShop } from '@/shop/counterShop';
import { DefaultGroup } from '@/vibes/definitions';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  const [moveId, setMoveId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const counters = useCounterShop(
    useShallow((state) =>
      state.counters
        .filter((c) => c.groupId === selectedGroupId)
        .filter((c) =>
          searchQuery.trim() === ''
            ? true
            : c.label.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .map((c) => c.id),
    ),
  );

  const selectedGroup = useCounterShop(
    (state) => state.groups.filter((g) => g.id === selectedGroupId)[0],
  );

  const closeSearch = () => {
    setSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (!searching) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSearch();
      return true;
    });

    return () => sub.remove();
  }, [searching]);

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
          {searching ? (
            <View className='flex-1 flex-row items-center bg-zinc-100 rounded-xl px-2'>
              <TouchableOpacity onPress={closeSearch} className='p-1'>
                <MaterialIcons name='arrow-back' size={22} color='#71717a' />
              </TouchableOpacity>
              <VibyInput
                className='flex-1 text-zinc-800 p-2 text-base'
                placeholder='Search counters...'
                placeholderTextColor='#a1a1aa'
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className='p-1'
                >
                  <MaterialIcons name='close' size={22} color='#71717a' />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <AntDesign
                className='p-1 ps-2'
                name='menu'
                size={24}
                color='#27272a'
                onPress={() => setDrawerVisible(true)}
              />
              <View className='flex-1 flex-row items-center justify-between'>
                <Text className='font-semibold text-2xl text-zinc-800'>
                  Counters - {selectedGroup.name}
                </Text>
                <TouchableOpacity onPress={() => setSearching(true)}>
                  <MaterialIcons name='search' size={24} color='#27272a' />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <ScrollView className='flex-1'>
          {counters.map((c) => (
            <CounterCard
              key={c}
              counterId={c}
              onEdit={() => setEditingId(c)}
              onActions={(id, pos) => {
                setActionsId(id);
                setActionsPos(pos);
              }}
            />
          ))}

          {counters.length === 0 && searchQuery.trim() !== '' && (
            <Text className='text-zinc-400 text-center mt-8'>
              No counters matching &quot;{searchQuery}&quot;
            </Text>
          )}

          <View className='h-20' />
        </ScrollView>

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
            setMoveId(actionsId);
            setActionsId(null);
          }}
          onClose={() => setActionsId(null)}
        />

        <MoveToGroupModal
          counterId={moveId}
          visible={!!moveId}
          onClose={() => setMoveId(null)}
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
