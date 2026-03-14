import AddCounterModal from '@/components/AddCounterModal';
import CounterCard from '@/components/CounterCard';
import EditCounterModal from '@/components/EditCounterModal';
import { useCounterShop } from '@/shop/counterShop';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const counters = useCounterShop(
    useShallow((state) => state.counters.map((c) => c.id)),
  );

  const [editingId, setEditingId] = useState<string | null>(null);

  const addCounter = useCounterShop((state) => state.addCounter);
  const deleteAll = useCounterShop((state) => state.deleteAll);

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
        <View className='flex-row'>
          <Pressable
            className='p-3 bg-green-300 rounded-xl m-2'
            onPress={() => {
              addCounter('New Counter');
            }}
          >
            <Text>Add Counter</Text>
          </Pressable>

          <Pressable
            className='p-3 bg-green-300 rounded-xl m-2'
            onPress={() => {
              deleteAll();
            }}
          >
            <Text>Delete All</Text>
          </Pressable>
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
