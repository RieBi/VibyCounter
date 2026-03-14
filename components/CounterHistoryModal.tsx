import {
  Counter,
  HistoryCreation,
  HistoryEntry,
  HistoryIncrement,
  HistoryReset,
  HistoryUtils,
} from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CounterHistoryModalProps {
  counter: Counter | undefined;
  visible: boolean;
  onClose: () => void;
}

const actionLabel: Record<number, string> = {
  [HistoryCreation]: 'Created',
  [HistoryIncrement]: 'Increment',
  [HistoryReset]: 'Reset',
};

const actionIcon: Record<number, keyof typeof MaterialIcons.glyphMap> = {
  [HistoryCreation]: 'add-circle-outline',
  [HistoryIncrement]: 'trending-up',
  [HistoryReset]: 'restart-alt',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  return (
    <View className='flex-row items-center py-3 px-2 border-b border-emerald-700/50'>
      <MaterialIcons
        name={actionIcon[entry.type] ?? 'circle'}
        size={22}
        color='#86efac'
      />
      <View className='ml-3 flex-1'>
        <Text className='text-white font-semibold'>
          {actionLabel[entry.type] ?? 'Unknown'}
        </Text>
        {HistoryUtils.isHistoryEntryIncrement(entry) && (
          <Text className='text-emerald-300 text-sm'>
            {entry.details.valueBefore} → {entry.details.valueAfter} (
            {entry.details.incrementBy > 0 ? '+' : ''}
            {entry.details.incrementBy})
          </Text>
        )}
      </View>
      <Text className='text-emerald-400 text-xs'>
        {formatTimestamp(entry.timestamp)}
      </Text>
    </View>
  );
}

export default function CounterHistoryModal({
  counter,
  visible,
  onClose,
}: CounterHistoryModalProps) {
  const history = counter?.history ? [...counter.history].reverse() : [];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType='slide'
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className='flex-1 justify-end bg-black/60'>
        <View className='bg-emerald-800 h-3/4 rounded-t-2xl border-t border-emerald-700'>
          <View className='flex-row justify-between items-center p-4 border-b border-emerald-700'>
            <Text className='text-white text-xl font-bold'>
              History — {counter?.label}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name='close' size={26} color='#EBF4FA' />
            </TouchableOpacity>
          </View>

          <FlatList
            data={history}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => <HistoryItem entry={item} />}
            contentContainerClassName='px-4'
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            ListEmptyComponent={
              <Text className='text-emerald-400 text-center mt-8'>
                No history yet
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
