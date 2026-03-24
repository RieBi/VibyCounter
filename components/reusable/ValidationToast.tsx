import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ValidationToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export default function ValidationToast({
  message,
  onDismiss,
  duration = 2500,
}: ValidationToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (message) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(duration, withTiming(0, { duration: 200 })),
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(duration, withTiming(-20, { duration: 200 })),
      );

      const timeout = setTimeout(onDismiss, duration + 400);
      return () => clearTimeout(timeout);
    }
  }, [message, duration, onDismiss, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <View
      pointerEvents='none'
      className='absolute left-0 right-0 items-center z-50'
      style={{ top: insets.top + 16 }}
    >
      <Animated.View
        style={style}
        className='bg-rose-600 px-4 py-2.5 rounded-xl flex-row items-center gap-2'
      >
        <MaterialIcons name='error-outline' size={18} color='white' />
        <Text className='text-white font-semibold text-sm'>{message}</Text>
      </Animated.View>
    </View>
  );
}