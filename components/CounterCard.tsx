import { useCounterStore } from '@/shop/counterShop';
import { Text, TouchableOpacity, View } from 'react-native';

interface CounterCardProps {
  counterId: string;
}

export default function CounterCard({ counterId }: CounterCardProps) {
  const counter = useCounterStore((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const increment = useCounterStore((state) => state.increment);
  const reset = useCounterStore((state) => state.resetCounter);
  const deleteCounter = useCounterStore((state) => state.deleteCounter);

  if (!counter) {
    return null;
  }

  return (
    <View className='bg-cyan-800 p-4 rounded-lg m-2'>
      <View className='flex-row items-center gap-5'>
        <Text className='text-white text-xl font-bold'>{counter.label}</Text>

        <Text className='text-4xl text-blue-400 my-4 text-center'>
          {counter.count}
        </Text>
      </View>

      <View className='flex-row justify-end gap-2'>
        <TouchableOpacity
          className='bg-green-600 p-3 px-4 rounded'
          onPress={() => increment(counter.id, 1)}
        >
          <Text className='text-white font-bold'>+1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='bg-red-500 p-3 rounded'
          onPress={() => reset(counter.id)}
        >
          <Text className='text-white font-bold'>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='bg-purple-500 p-3 rounded'
          onPress={() => deleteCounter(counter.id)}
        >
          <Text className='text-white font-bold'>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
