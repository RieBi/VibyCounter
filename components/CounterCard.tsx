import { useCounterShop } from '@/shop/counterShop';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import CounterActionsMenu from './CounterActionsMenu';

interface CounterCardProps {
  counterId: string;
  color?: string;
  onEdit: () => void;
  onActions: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function isLightColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

export default function CounterCard({
  counterId,
  color = '#0e7490',
  onEdit,
  onActions,
}: CounterCardProps) {
  const counter = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const increment = useCounterShop((state) => state.increment);

  if (!counter) return null;

  const light = isLightColor(color);
  const textColor = light ? '#18181b' : '#fafafa';
  const btnBg = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';

  return (
    <Pressable
      onPress={onEdit}
      style={{ backgroundColor: color }}
      className='mx-3 my-1.5 px-4 py-3 rounded-2xl'
    >
      <View className='flex-row items-center justify-between'>
        <Text
          style={{ color: textColor }}
          className='text-sm font-semibold flex-1'
          numberOfLines={1}
        >
          {counter.label}
        </Text>
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
