import CounterCard from '@/components/CounterCard';
import { useCounterStore } from '@/shop/counterShop';
import { Pressable, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

export default function Index() {
  const counters = useCounterStore(
    useShallow((state) => state.counters.map((c) => c.id)),
  );

  const addCounter = useCounterStore((state) => state.addCounter);
  const deleteAll = useCounterStore((state) => state.deleteAll);

  return (
    <View className='flex-1 justify-center'>
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

      <View className='flex-1'>
        {counters.map((c) => (
          <CounterCard key={c} counterId={c}></CounterCard>
        ))}
      </View>
    </View>
  );
}
