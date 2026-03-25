import { useCounterShop } from '@/shop/counterShop';
import { DefaultColor, isLightColor } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';
import CounterActionsMenu from './CounterActionsMenu';

interface CounterCardProps {
  counterId: string;
  onEdit: () => void;
  onActions: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
}

export default function CounterCard({
  counterId,
  onEdit,
  onActions,
}: CounterCardProps) {
  const drag = useReorderableDrag();

  const counter = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const increment = useCounterShop((state) => state.increment);

  if (!counter) return null;

  const color = counter.styling.color ?? DefaultColor;
  const light = isLightColor(color);
  const textColor = light ? '#18181b' : '#fafafa';
  const btnBg = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';

  return (
    <Pressable
      onPress={onEdit}
      onLongPress={drag}
      style={{ backgroundColor: color }}
      className='mx-3 my-1.5 px-4 py-3 rounded-2xl'
    >
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center flex-1 gap-2'>
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
        <CounterActionsMenu
          iconColor={textColor}
          onPress={(pos) => onActions(counterId, pos)}
        />
      </View>

      <View className='flex-row items-center justify-center gap-8 pt-1 pb-3'>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: btnBg }}
          className='h-14 w-14 rounded-full items-center justify-center'
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            return increment(counter.id, -counter.settings.decrementBy);
          }}
        >
          <MaterialIcons name='remove' size={28} color={textColor} />
        </TouchableOpacity>

        <Text
          style={{ color: textColor, minWidth: 60 }}
          className='text-4xl font-bold text-center'
        >
          {counter.count}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: btnBg }}
          className='h-14 w-14 rounded-full items-center justify-center'
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            return increment(counter.id, counter.settings.incrementBy);
          }}
        >
          <MaterialIcons name='add' size={28} color={textColor} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
