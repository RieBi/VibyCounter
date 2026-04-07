import { useCounterShop } from '@/shop/counterShop';
import { useSettingsShop } from '@/shop/settingsShop';
import {
  DefaultColor,
  getProgress,
  hexToRgb,
  isLightColor,
} from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useReorderableDrag } from 'react-native-reorderable-list';
import CounterActionsMenu from './CounterActionsMenu';

interface CounterCardProps {
  counterId: string;
  onEdit: () => void;
  onActions: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
  reorderable?: boolean;
  selected?: boolean;
  selecting?: boolean;
  onSelect?: () => void;
  didMove?: SharedValue<boolean>;
}

export default function CounterCard({
  counterId,
  onEdit,
  onActions,
  reorderable = true,
  selected = false,
  selecting = false,
  onSelect,
  didMove,
}: CounterCardProps) {
  const drag = useReorderableDrag();

  const counter = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const increment = useCounterShop((state) => state.increment);
  const hapticsEnabled = useSettingsShop((state) => state.display.hapticsEnabled);

  const justLongPressed = useRef(false);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerImpact = useCallback(
    (style: Haptics.ImpactFeedbackStyle) => {
      if (!hapticsEnabled) return;
      Haptics.impactAsync(style);
    },
    [hapticsEnabled],
  );

  const startRepeat = useCallback(
    (amount: number) => {
      triggerImpact(Haptics.ImpactFeedbackStyle.Soft);
      increment(counterId, amount);
      const delay = setTimeout(() => {
        repeatTimer.current = setInterval(() => {
          triggerImpact(Haptics.ImpactFeedbackStyle.Soft);
          increment(counterId, amount);
        }, 80);
      }, 400);
      repeatTimer.current = delay as unknown as ReturnType<typeof setInterval>;
    },
    [counterId, increment, triggerImpact],
  );

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current !== null) {
      clearTimeout(
        repeatTimer.current as unknown as ReturnType<typeof setTimeout>,
      );
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  if (!counter) return null;

  const color = counter.styling.color ?? DefaultColor;
  const light = isLightColor(color);
  const textColor = light ? '#18181b' : '#fafafa';
  const btnBg = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';

  // Green hue range (~80–160) — completion bar would be invisible on green cards
  const [cr, cg, cb] = hexToRgb(color);
  const isGreenish = cg > cr && cg > cb;

  const handlePress = () => {
    if (justLongPressed.current) {
      justLongPressed.current = false;
      return;
    }
    if (selecting) {
      triggerImpact(Haptics.ImpactFeedbackStyle.Light);
      onSelect?.();
    } else {
      onEdit();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={
        reorderable
          ? () => {
              if (didMove) didMove.value = false;
              drag();
            }
          : selecting
            ? undefined
            : () => {
                justLongPressed.current = true;
                triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
                onSelect?.();
              }
      }
      onPressOut={() => {
        if (reorderable && didMove && !didMove.value) {
          triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
          onSelect?.();
        }
        if (didMove) didMove.value = true;
      }}
      style={{ backgroundColor: color }}
      className='mx-3 my-1.5 px-4 py-3 rounded-2xl'
    >
      {/* Dim overlay when selecting but not selected */}
      {selecting && !selected && (
        <View
          className='absolute inset-0 bg-black/30 rounded-2xl'
          pointerEvents='none'
        />
      )}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center flex-1 gap-2'>
          {selecting && (
            <MaterialIcons
              name={selected ? 'check-circle' : 'radio-button-unchecked'}
              size={20}
              color={selected ? '#22c55e' : textColor}
            />
          )}
          {counter.styling.icon && (
            <MaterialIcons
              name={counter.styling.icon as keyof typeof MaterialIcons.glyphMap}
              size={16}
              color={textColor}
            />
          )}
          <Text
            style={{ color: textColor }}
            className='text-sm font-semibold flex-1'
            numberOfLines={1}
          >
            {counter.label}
          </Text>
        </View>
        {!selecting && (
          <CounterActionsMenu
            iconColor={textColor}
            onPress={(pos) => onActions(counterId, pos)}
          />
        )}
      </View>

      <View className='flex-row items-center justify-center pt-1 pb-3'>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: btnBg }}
          className='h-14 w-14 rounded-full items-center justify-center'
          onPressIn={() => startRepeat(-counter.settings.decrementBy)}
          onPressOut={stopRepeat}
        >
          <MaterialIcons name='remove' size={28} color={textColor} />
        </TouchableOpacity>

        <View className='items-center mx-4'>
          <Text
            style={{
              color: textColor,
              fontVariant: ['tabular-nums'],
              width: Math.min(
                180,
                Math.max(80, `${Math.abs(counter.count)}`.length * 18),
              ),
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            className='text-4xl font-bold text-center'
          >
            {counter.count.toLocaleString()}
          </Text>
          {counter.settings.goal != null && (
            <Text
              style={{ color: textColor, opacity: 0.6 }}
              className='text-xs'
            >
              / {counter.settings.goal.toLocaleString()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: btnBg }}
          className='h-14 w-14 rounded-full items-center justify-center'
          onPressIn={() => startRepeat(counter.settings.incrementBy)}
          onPressOut={stopRepeat}
        >
          <MaterialIcons name='add' size={28} color={textColor} />
        </TouchableOpacity>
      </View>

      {counter.settings.goal != null && (
        <View
          style={{ backgroundColor: btnBg }}
          className='h-1 rounded-full overflow-hidden mb-1'
        >
          <View
            style={{
              width: `${getProgress(counter.count, counter.settings.defaultValue, counter.settings.goal) * 100}%`,
              backgroundColor:
                getProgress(
                  counter.count,
                  counter.settings.defaultValue,
                  counter.settings.goal,
                ) >= 1
                  ? isGreenish
                    ? '#ffffff'
                    : '#22c55e'
                  : light
                    ? 'rgba(0,0,0,0.6)'
                    : 'rgba(255,255,255,0.6)',
            }}
            className='h-full rounded-full'
          />
        </View>
      )}
    </Pressable>
  );
}
