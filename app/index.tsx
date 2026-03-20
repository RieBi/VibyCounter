import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import { useCounterShop } from '@/shop/counterShop';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const counters = useCounterShop(
    useShallow((state) => state.counters.map((c) => c.id)),
  );

  const [editingId, setEditingId] = useState<string | null>(null);

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
          />
          <Text className='font-semibold text-2xl text-zinc-800'>Counters</Text>
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
          <AddCounterModal></AddCounterModal>
        </View>

        <EditCounterModal
          counterId={editingId}
          onClose={() => setEditingId(null)}
        />
      </View>
    </View>
  );
}
