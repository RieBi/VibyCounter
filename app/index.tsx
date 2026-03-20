import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import GroupDrawer from '@/components/GroupDrawer';
import { useCounterShop } from '@/shop/counterShop';
import { DefaultGroup } from '@/vibes/definitions';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    DefaultGroup.id,
  );

  const counters = useCounterShop(
    useShallow((state) =>
      state.counters
        .filter((c) => c.groupId === selectedGroupId)
        .map((c) => c.id),
    ),
  );

  const selectedGroup = useCounterShop(
    (state) => state.groups.filter((g) => g.id === selectedGroupId)[0],
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
        <View className='flex-row items-center p-2 gap-3'>
          <AntDesign
            className='p-1 ps-2'
            name='menu'
            size={24}
            color='#27272a'
            onPress={() => setDrawerVisible(true)}
          />
          <Text className='font-semibold text-2xl text-zinc-800'>
            Counters - {selectedGroup.name}
          </Text>
        </View>

        <ScrollView className='flex-1'>
          {counters.map((c) => (
            <CounterCard
              key={c}
              counterId={c}
              onEdit={() => setEditingId(c)}
            ></CounterCard>
          ))}

          <View className='h-20'></View>
        </ScrollView>

        <View className='absolute right-6 bottom-6'>
          <AddCounterModal selectedGroupId={selectedGroupId}></AddCounterModal>
        </View>

        <EditCounterModal
          counterId={editingId}
          onClose={() => setEditingId(null)}
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
