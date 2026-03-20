import { useCounterShop } from '@/shop/counterShop';
import { Text, TouchableOpacity, View } from 'react-native';

interface CounterCardProps {
  counterId: string;
  onEdit: () => void;
}

export default function CounterCard({ counterId, onEdit }: CounterCardProps) {
  const counter = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const increment = useCounterShop((state) => state.increment);
  const reset = useCounterShop((state) => state.resetCounter);
  const deleteCounter = useCounterShop((state) => state.deleteCounter);

  if (!counter) {
    return null;
  }

  return (
    <View className='bg-cyan-600 border-cyan-700 border-2 p-2 rounded-2xl m-2'>
      <View className='flex-row items-center justify-between'>
        <TouchableOpacity activeOpacity={0.8} onPress={() => onEdit()}>
          <Text className='text-white text-xl font-bold'>{counter.label}</Text>
        </TouchableOpacity>
        <View className='flex-row justify-end gap-3'>
          <TouchableOpacity
            className='border-red-500 border p-2 rounded-lg'
            activeOpacity={0.8}
            onPress={() => reset(counter.id)}
          >
            <Text className='text-white font-bold'>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='border-orange-500 border p-2 rounded-lg'
            activeOpacity={0.8}
            onPress={() => onEdit()}
          >
            <Text className='text-white font-bold'>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className='border-purple-500 border p-2 rounded-lg'
            activeOpacity={0.8}
            onPress={() => deleteCounter(counter.id)}
          >
            <Text className='text-white font-bold'>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className='flex-row justify-between px-[15%] items-center gap-5 pt-1'>
        <TouchableOpacity
          className='bg-cyan-500 border border-white p-2 px-5 rounded-full justify-center items-center'
          activeOpacity={0.7}
          onPress={() => increment(counter.id, -counter.settings.decrementBy)}
        >
          <Text className='text-white font-bold'>
            {formatNumber(-counter.settings.decrementBy)}
          </Text>
        </TouchableOpacity>

        <Text className='text-4xl font-semibold text-blue-50 text-center'>
          {counter.count}
        </Text>

        <TouchableOpacity
          className='bg-cyan-500 border border-white p-2 px-5 rounded-full justify-center items-center'
          activeOpacity={0.7}
          onPress={() => increment(counter.id, counter.settings.incrementBy)}
        >
          <Text className='text-white font-bold'>
            {formatNumber(counter.settings.incrementBy)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatNumber(num: number): string {
  return (num >= 0 ? '+' : '') + num;
}
