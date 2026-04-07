import { useCounterShop } from '@/shop/counterShop';
import {
  getDailyCounts,
  getHistoryPage,
  HistoryCursor,
  HistoryRange,
} from '@/data/historyDb';
import {
  Counter,
  HistoryAction,
  HistoryEntry,
} from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useMemo, useState } from 'react';
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
import ConfirmModal from './reusable/ConfirmModal';

interface CounterHistoryModalProps {
  counter: Counter | undefined;
  visible: boolean;
  onClose: () => void;
}

const DURATION = 250;

const actionLabel: Record<number, string> = {
  [HistoryAction.Creation]: 'Created',
  [HistoryAction.Increment]: 'Increment',
  [HistoryAction.Reset]: 'Reset',
  [HistoryAction.SettingsChange]: 'Settings changed',
};

const actionIcon: Record<number, keyof typeof MaterialIcons.glyphMap> = {
  [HistoryAction.Creation]: 'add-circle-outline',
  [HistoryAction.Increment]: 'trending-up',
  [HistoryAction.Reset]: 'restart-alt',
  [HistoryAction.SettingsChange]: 'tune',
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

type RangePreset = '7d' | '30d' | '90d' | 'all';

const PAGE_SIZE = 80;

function getRangeFromPreset(preset: RangePreset): HistoryRange {
  if (preset === 'all') return {};

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days =
    preset === '7d' ? 7
    : preset === '30d' ? 30
    : 90;
  return { startTs: now - dayMs * days, endTs: now };
}

function formatDayLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const isIncrement = entry.type === HistoryAction.Increment && entry.details;
  const isSettings = entry.type === HistoryAction.SettingsChange && entry.changes;

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
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);
  const [cursor, setCursor] = useState<HistoryCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dailyCounts, setDailyCounts] = useState<{ dayKey: string; count: number }[]>(
    [],
  );

  const clearHistory = useCounterShop((state) => state.clearHistory);
  const insets = useSafeAreaInsets();

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(1000);

  const range = useMemo(() => getRangeFromPreset(preset), [preset]);

  const hydrate = (opts?: { resetCursor?: boolean }) => {
    if (!counter) return;
    if (loading) return;

    setLoading(true);
    const page = getHistoryPage(counter.id, {
      limit: PAGE_SIZE,
      range,
      cursor: opts?.resetCursor ? null : cursor,
    });

    if (opts?.resetCursor) {
      setHistoryItems(page.items);
    } else {
      setHistoryItems((prev) => [...prev, ...page.items]);
    }
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);

    if (opts?.resetCursor) {
      setDailyCounts(getDailyCounts(counter.id, range));
    }
    setLoading(false);
  };

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

  useEffect(() => {
    if (!visible || !counter) return;
    hydrate({ resetCursor: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter?.id, preset, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

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
          <Text
            className='text-white text-xl font-bold flex-1 mr-2'
            numberOfLines={1}
          >
            History — {counter?.label}
          </Text>
          <View className='flex-row items-center gap-4'>
            {counter && counter.historyCount > 1 && (
              <TouchableOpacity onPress={() => setConfirmClearVisible(true)}>
                <MaterialIcons name='delete-sweep' size={24} color='#f87171' />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name='close' size={26} color='#EBF4FA' />
            </TouchableOpacity>
          </View>
        </View>

        <View className='px-4 pt-3 pb-2 border-b border-emerald-700/70'>
          <View className='flex-row gap-2'>
            {(['7d', '30d', '90d', 'all'] as RangePreset[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPreset(p)}
                className={`px-3 py-2 rounded-lg border ${preset === p ? 'bg-emerald-500 border-emerald-300' : 'bg-emerald-900 border-emerald-700'}`}
              >
                <Text
                  className={`text-xs font-semibold ${preset === p ? 'text-emerald-950' : 'text-emerald-200'}`}
                >
                  {p === 'all' ? 'All time' : p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className='text-emerald-200 text-xs mt-2'>
            Showing {historyItems.length.toLocaleString()} entries
            {counter ? ` of ${counter.historyCount.toLocaleString()}` : ''}
          </Text>
        </View>

        <View className='px-4 pt-3 pb-2 border-b border-emerald-700/70'>
          <Text className='text-emerald-200 text-sm font-semibold mb-2'>
            Activity density by day
          </Text>
          <FlatList
            horizontal
            data={dailyCounts}
            keyExtractor={(item) => item.dayKey}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const maxCount = Math.max(1, ...dailyCounts.map((x) => x.count));
              const ratio = item.count / maxCount;
              const height = 8 + Math.round(ratio * 26);
              return (
                <View className='mr-2 items-center w-14'>
                  <View
                    className='w-7 rounded-t-md bg-lime-400'
                    style={{ height, opacity: item.count === 0 ? 0.2 : 1 }}
                  />
                  <Text className='text-[10px] text-emerald-300 mt-1'>
                    {formatDayLabel(item.dayKey)}
                  </Text>
                  <Text className='text-[10px] text-emerald-400'>
                    {item.count}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className='text-emerald-400 text-xs'>No entries in range</Text>
            }
          />
        </View>

        <FlatList
          data={historyItems}
          keyExtractor={(item, i) => `${item.timestamp}-${item.type}-${i}`}
          renderItem={({ item }) => <HistoryItem entry={item} />}
          onEndReached={() => {
            if (!hasMore || loading) return;
            hydrate();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom,
          }}
          ListEmptyComponent={
            <Text className='text-emerald-400 text-center mt-8'>
              No history yet
            </Text>
          }
          ListFooterComponent={
            hasMore ?
              <TouchableOpacity
                className='py-4 items-center'
                onPress={() => hydrate()}
                disabled={loading}
              >
                <Text className='text-lime-300 font-semibold'>
                  {loading ? 'Loading...' : 'Load more'}
                </Text>
              </TouchableOpacity>
            : null
          }
        />
      </Animated.View>

      <ConfirmModal
        visible={confirmClearVisible}
        title='Clear History'
        message={`Are you sure you want to clear all history for "${counter?.label}"?`}
        confirmLabel='Clear'
        onConfirm={() => {
          if (counter) {
            clearHistory(counter.id);
            hydrate({ resetCursor: true });
          }
          setConfirmClearVisible(false);
        }}
        onCancel={() => setConfirmClearVisible(false)}
      />
    </View>
  );
}
