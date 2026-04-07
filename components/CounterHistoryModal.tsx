import { useCounterShop } from '@/shop/counterShop';
import {
  getDailyCounts,
  getHistoryPage,
  HistoryCursor,
  HistoryPageSortOrder,
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
  ScrollView,
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
const PAGE_SIZE = 80;

type RangePreset = '7d' | '30d' | '90d' | 'all';
type RangeMode = 'preset' | 'custom';
type Granularity = 'day' | 'week' | 'month';

type DensityBucket = {
  key: string;
  startTs: number;
  endTs: number;
  count: number;
};

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

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const weekday = d.getDay();
  const mondayOffset = (weekday + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfWeek(ts: number): number {
  const d = new Date(startOfWeek(ts));
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatRangeLabel(startTs: number, endTs: number): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

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

function formatBucketLabel(startTs: number, granularity: Granularity): string {
  const d = new Date(startTs);
  if (granularity === 'month') {
    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildBuckets(
  dailyRows: { dayKey: string; count: number }[],
  granularity: Granularity,
): DensityBucket[] {
  const map = new Map<string, DensityBucket>();

  for (const row of dailyRows) {
    const dayTs = new Date(`${row.dayKey}T00:00:00.000Z`).getTime();
    let key = row.dayKey;
    let startTs = startOfDay(dayTs);
    let endTs = endOfDay(dayTs);

    if (granularity === 'week') {
      const weekStart = startOfWeek(dayTs);
      const d = new Date(weekStart);
      key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      startTs = weekStart;
      endTs = endOfWeek(dayTs);
    } else if (granularity === 'month') {
      const d = new Date(dayTs);
      key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      startTs = startOfMonth(dayTs);
      endTs = endOfMonth(dayTs);
    }

    const existing = map.get(key);
    if (!existing) {
      map.set(key, { key, startTs, endTs, count: row.count });
      continue;
    }
    existing.count += row.count;
    if (startTs < existing.startTs) existing.startTs = startTs;
    if (endTs > existing.endTs) existing.endTs = endTs;
  }

  return [...map.values()].sort((a, b) => a.startTs - b.startTs);
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
            {entry.details!.valueBefore} {'->'} {entry.details!.valueAfter} (
            {entry.details!.incrementBy > 0 ? '+' : ''}
            {entry.details!.incrementBy})
          </Text>
        )}
        {isSettings &&
          entry.changes!.map((c, i) => (
            <Text key={i} className='text-emerald-300 text-sm'>
              {c.field}: {c.from} {'->'} {c.to}
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
  const [mode, setMode] = useState<RangeMode>('preset');
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [customStart, setCustomStart] = useState<number | null>(null);
  const [customEnd, setCustomEnd] = useState<number | null>(null);
  const [customSortOrder, setCustomSortOrder] =
    useState<HistoryPageSortOrder>('desc');
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);
  const [cursor, setCursor] = useState<HistoryCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dailyCountsInRange, setDailyCountsInRange] = useState<
    { dayKey: string; count: number }[]
  >([]);
  const [dailyCountsAll, setDailyCountsAll] = useState<{ dayKey: string; count: number }[]>(
    [],
  );

  const clearHistory = useCounterShop((state) => state.clearHistory);
  const insets = useSafeAreaInsets();

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(1000);

  const activeRange = useMemo<HistoryRange>(() => {
    if (mode === 'custom' && customStart != null && customEnd != null) {
      return {
        startTs: Math.min(customStart, customEnd),
        endTs: Math.max(customStart, customEnd),
      };
    }
    return getRangeFromPreset(preset);
  }, [mode, customStart, customEnd, preset]);

  const historySortOrder = useMemo<HistoryPageSortOrder>(
    () =>
      mode === 'custom' && customStart != null && customEnd != null ?
        customSortOrder
      : 'desc',
    [mode, customStart, customEnd, customSortOrder],
  );

  const customBuckets = useMemo(
    () => buildBuckets(dailyCountsAll, granularity),
    [dailyCountsAll, granularity],
  );

  const fetchHistoryPage = (nextCursor: HistoryCursor | null, reset: boolean) => {
    if (!counter || loading) return;

    setLoading(true);
    const page = getHistoryPage(counter.id, {
      limit: PAGE_SIZE,
      range: activeRange,
      cursor: reset ? null : nextCursor,
      sortOrder: historySortOrder,
    });

    if (reset) {
      setHistoryItems(page.items);
      setDailyCountsInRange(getDailyCounts(counter.id, activeRange));
    } else {
      setHistoryItems((prev) => [...prev, ...page.items]);
    }
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: DURATION });
      translateY.value = withTiming(0, { duration: DURATION });
      return;
    }
    backdropOpacity.value = withTiming(0, { duration: DURATION });
    translateY.value = withTiming(1000, { duration: DURATION });
    const timeout = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(timeout);
  }, [visible, backdropOpacity, translateY]);

  useEffect(() => {
    if (!visible || !counter) return;
    setDailyCountsAll(getDailyCounts(counter.id, {}));
  }, [counter, visible]);

  useEffect(() => {
    if (!visible || !counter) return;
    fetchHistoryPage(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, counter?.id, activeRange.startTs, activeRange.endTs, historySortOrder]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  return (
    <View className='absolute inset-0 z-50'>
      <Animated.View style={backdropStyle} className='absolute inset-0 bg-black/60'>
        <Pressable className='flex-1' onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={sheetStyle}
        className='absolute bottom-0 left-0 right-0 h-3/4 bg-emerald-800 rounded-t-2xl border-t border-emerald-700'
      >
        <View className='flex-row justify-between items-center p-4 border-b border-emerald-700'>
          <Text className='text-white text-xl font-bold flex-1 mr-2' numberOfLines={1}>
            History - {counter?.label}
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
          <View className='flex-row gap-2 mb-2'>
            <TouchableOpacity
              onPress={() => setMode('preset')}
              className={`px-3 py-2 rounded-lg border ${mode === 'preset' ? 'bg-emerald-500 border-emerald-300' : 'bg-emerald-900 border-emerald-700'}`}
            >
              <Text
                className={`text-xs font-semibold ${mode === 'preset' ? 'text-emerald-950' : 'text-emerald-200'}`}
              >
                Presets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('custom')}
              className={`px-3 py-2 rounded-lg border ${mode === 'custom' ? 'bg-emerald-500 border-emerald-300' : 'bg-emerald-900 border-emerald-700'}`}
            >
              <Text
                className={`text-xs font-semibold ${mode === 'custom' ? 'text-emerald-950' : 'text-emerald-200'}`}
              >
                Custom range
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'preset' && (
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
          )}

          {mode === 'custom' && (
            <View>
              <View className='flex-row gap-2 mb-2'>
                {(['day', 'week', 'month'] as Granularity[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setGranularity(g);
                      setCustomStart(null);
                      setCustomEnd(null);
                    }}
                    className={`px-3 py-2 rounded-lg border ${granularity === g ? 'bg-lime-500 border-lime-300' : 'bg-emerald-900 border-emerald-700'}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${granularity === g ? 'text-emerald-950' : 'text-emerald-200'}`}
                    >
                      {g[0].toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className='flex-row items-end py-1'>
                  {customBuckets.map((bucket) => {
                    const maxCount = Math.max(1, ...customBuckets.map((x) => x.count));
                    const ratio = bucket.count / maxCount;
                    const height = 10 + Math.round(ratio * 30);
                    const start = customStart != null ? Math.min(customStart, customEnd ?? customStart) : null;
                    const end = customStart != null ? Math.max(customStart, customEnd ?? customStart) : null;
                    const inRange =
                      start != null &&
                      end != null &&
                      bucket.startTs >= start &&
                      bucket.endTs <= end;
                    const isEdge =
                      (customStart != null && bucket.startTs === customStart) ||
                      (customEnd != null && bucket.endTs === customEnd);

                    return (
                      <TouchableOpacity
                        key={bucket.key}
                        className='mr-2 items-center w-14'
                        onPress={() => {
                          if (customStart == null || customEnd != null) {
                            setCustomStart(bucket.startTs);
                            setCustomEnd(null);
                            return;
                          }
                          if (bucket.endTs < customStart) {
                            setCustomEnd(customStart);
                            setCustomStart(bucket.startTs);
                            return;
                          }
                          setCustomEnd(bucket.endTs);
                        }}
                      >
                        <View
                          className={`w-7 rounded-t-md ${isEdge ? 'bg-lime-200' : inRange ? 'bg-lime-400' : 'bg-emerald-500'}`}
                          style={{ height, opacity: bucket.count === 0 ? 0.25 : 1 }}
                        />
                        <Text className='text-[10px] text-emerald-300 mt-1 text-center'>
                          {formatBucketLabel(bucket.startTs, granularity)}
                        </Text>
                        <Text className='text-[10px] text-emerald-400'>{bucket.count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text className='text-emerald-200 text-xs mt-2'>
                {customStart == null ?
                  'Pick start period'
                : customEnd == null ?
                  'Pick end period'
                : `Selected: ${formatRangeLabel(Math.min(customStart, customEnd), Math.max(customStart, customEnd))}`}
              </Text>
              {customStart != null && customEnd != null && (
                <View className='flex-row gap-2 mt-3'>
                  <TouchableOpacity
                    onPress={() => setCustomSortOrder('desc')}
                    className={`px-3 py-2 rounded-lg border ${customSortOrder === 'desc' ? 'bg-lime-500 border-lime-300' : 'bg-emerald-900 border-emerald-700'}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${customSortOrder === 'desc' ? 'text-emerald-950' : 'text-emerald-200'}`}
                    >
                      Newest first
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCustomSortOrder('asc')}
                    className={`px-3 py-2 rounded-lg border ${customSortOrder === 'asc' ? 'bg-lime-500 border-lime-300' : 'bg-emerald-900 border-emerald-700'}`}
                  >
                    <Text
                      className={`text-xs font-semibold ${customSortOrder === 'asc' ? 'text-emerald-950' : 'text-emerald-200'}`}
                    >
                      Oldest first
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View className='flex-row gap-2 mt-2'>
                <TouchableOpacity
                  className='px-3 py-2 rounded-lg border border-emerald-600 bg-emerald-900'
                  onPress={() => {
                    setCustomStart(null);
                    setCustomEnd(null);
                  }}
                >
                  <Text className='text-emerald-200 text-xs font-semibold'>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-3 py-2 rounded-lg border ${customStart != null && customEnd != null ? 'border-lime-300 bg-lime-500' : 'border-emerald-600 bg-emerald-900'}`}
                  onPress={() => {
                    if (customStart == null || customEnd == null) return;
                    setMode('custom');
                  }}
                  disabled={customStart == null || customEnd == null}
                >
                  <Text
                    className={`text-xs font-semibold ${customStart != null && customEnd != null ? 'text-emerald-950' : 'text-emerald-200'}`}
                  >
                    Apply range
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text className='text-emerald-200 text-xs mt-2'>
            Showing {historyItems.length.toLocaleString()} entries
            {counter ? ` of ${counter.historyCount.toLocaleString()}` : ''}
          </Text>
        </View>

        <View className='px-4 pt-3 pb-2 border-b border-emerald-700/70'>
          <Text className='text-emerald-200 text-sm font-semibold mb-2'>
            Activity density in current range
          </Text>
          <FlatList
            horizontal
            data={dailyCountsInRange}
            keyExtractor={(item) => item.dayKey}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const maxCount = Math.max(1, ...dailyCountsInRange.map((x) => x.count));
              const ratio = item.count / maxCount;
              const height = 8 + Math.round(ratio * 26);
              return (
                <View className='mr-2 items-center w-14'>
                  <View
                    className='w-7 rounded-t-md bg-lime-400'
                    style={{ height, opacity: item.count === 0 ? 0.2 : 1 }}
                  />
                  <Text className='text-[10px] text-emerald-300 mt-1'>
                    {formatShortDate(new Date(`${item.dayKey}T00:00:00.000Z`).getTime())}
                  </Text>
                  <Text className='text-[10px] text-emerald-400'>{item.count}</Text>
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
            fetchHistoryPage(cursor, false);
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom,
          }}
          ListEmptyComponent={
            <Text className='text-emerald-400 text-center mt-8'>No history yet</Text>
          }
          ListFooterComponent={
            hasMore ?
              <TouchableOpacity
                className='py-4 items-center'
                onPress={() => fetchHistoryPage(cursor, false)}
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
            setCustomStart(null);
            setCustomEnd(null);
            setDailyCountsAll([]);
            fetchHistoryPage(null, true);
          }
          setConfirmClearVisible(false);
        }}
        onCancel={() => setConfirmClearVisible(false)}
      />
    </View>
  );
}
