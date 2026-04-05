import { useCallback, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface UndoToastProps {
  message: string | null;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({
  message,
  onUndo,
  onDismiss,
  duration = 4000,
}: UndoToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisible = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const animateOut = useCallback(
    (cb: () => void) => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 }, () => {
        runOnJS(cb)();
      });
    },
    [opacity, translateY],
  );

  useEffect(() => {
    if (message) {
      // Show / reset
      clearTimer();
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      isVisible.current = true;

      timer.current = setTimeout(() => {
        isVisible.current = false;
        animateOut(onDismiss);
      }, duration);
    } else if (isVisible.current) {
      clearTimer();
      isVisible.current = false;
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [
    message,
    duration,
    onDismiss,
    clearTimer,
    animateOut,
    opacity,
    translateY,
  ]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleUndo = useCallback(() => {
    clearTimer();
    isVisible.current = false;
    animateOut(onUndo);
  }, [clearTimer, animateOut, onUndo]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <View
      pointerEvents='box-none'
      className='absolute left-4 right-4 z-[60]'
      style={{ bottom: 88 }}
    >
      <Animated.View
        style={style}
        className='bg-zinc-800 px-4 py-3 rounded-xl flex-row items-center justify-between shadow-lg'
      >
        <Text className='text-white text-sm flex-1 mr-3' numberOfLines={1}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleUndo} hitSlop={8}>
          <Text className='text-cyan-400 font-bold text-sm'>UNDO</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
