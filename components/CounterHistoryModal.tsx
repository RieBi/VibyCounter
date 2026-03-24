import {
  Counter,
  HistoryCreation,
  HistoryEntry,
  HistoryIncrement,
  HistoryReset,
  HistorySettingsChange,
} from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CounterHistoryModalProps {
  counter: Counter | undefined;
  visible: boolean;
  onClose: () => void;
}

const DURATION = 250;

const actionLabel: Record<number, string> = {
  [HistoryCreation]: 'Created',
  [HistoryIncrement]: 'Increment',
  [HistoryReset]: 'Reset',
  [HistorySettingsChange]: 'Settings changed',
};

const actionIcon: Record<number, keyof typeof MaterialIcons.glyphMap> = {
  [HistoryCreation]: 'add-circle-outline',
  [HistoryIncrement]: 'trending-up',
  [HistoryReset]: 'restart-alt',
  [HistorySettingsChange]: 'tune',
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
  const isIncrement = entry.type === HistoryIncrement && entry.details;
  const isSettings = entry.type === HistorySettingsChange && entry.changes;

  return (
    <View className='flex-row items-start py-3 px-2 border-b border-emerald-700/50'>
      <MaterialIcons
        name={actionIcon[entry.type] ?? 'circle'}
        size={22}
        color='#86efac'
        style={{ marginTop: 2 }}
      />
      <View className='ml-3 flex-1'>
        <Text className='text-white font-semibold'>
          {actionLabel[entry.type] ?? 'Unknown'}
        </Text>
        {isIncrement && (
          <Text className='text-emerald-300 text-sm'>
            {entry.details!.valueBefore} → {entry.details!.valueAfter} (
            {entry.details!.incrementBy > 0 ? '+' : ''}
            {entry.details!.incrementBy})
          </Text>
        )}
        {isSettings &&
          entry.changes!.map((c, i) => (
            <Text key={i} className='text-emerald-300 text-sm'>
              {c.field}: {c.from} → {c.to}
            </Text>
          ))}
      </View>
      <Text className='text-emerald-400 text-xs' style={{ marginTop: 2 }}>
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
  const [mounted, setMounted] = useState(false);
  const insets = useSafeAreaInsets();

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(1000);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: DURATION });
      translateY.value = withTiming(0, { duration: DURATION });
    } else {
      backdropOpacity.value = withTiming(0, { duration: DURATION });
      translateY.value = withTiming(1000, { duration: DURATION });
      const timeout = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(timeout);
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const history = counter?.history ? [...counter.history].reverse() : [];

  if (!mounted) return null;

  return (
    <View className='absolute inset-0 z-50'>
      {/* Fading backdrop */}
      <Animated.View
        style={backdropStyle}
        className='absolute inset-0 bg-black/60'
      >
        <Pressable className='flex-1' onPress={onClose} />
      </Animated.View>

      {/* Sliding sheet */}
      <Animated.View
        style={sheetStyle}
        className='absolute bottom-0 left-0 right-0 h-3/4 bg-emerald-800 rounded-t-2xl border-t border-emerald-700'
      >
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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom,
          }}
          ListEmptyComponent={
            <Text className='text-emerald-400 text-center mt-8'>
              No history yet
            </Text>
          }
        />
      </Animated.View>
    </View>
  );
}
