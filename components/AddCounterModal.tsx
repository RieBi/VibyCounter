import { useCounterShop } from '@/shop/counterShop';
import { DefaultColor } from '@/vibes/definitions';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useReanimatedFocusedInput,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CounterAppearanceFields from './reusable/CounterAppearanceFields';
import CounterSettingsFields from './reusable/CounterSettingsFields';
import ValidationToast from './reusable/ValidationToast';
import VibyInput from './reusable/VibyInput';

const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 66;
const CARD_MARGIN = 4;
const WINDOW_HEIGHT = Dimensions.get('window').height;

interface AddCounterModalProps {
  selectedGroupId: string;
}

export default function AddCounterModal({
  selectedGroupId,
}: AddCounterModalProps) {
  const [isModalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState('');
  const [defaultValue, setDefaultValue] = useState('0');
  const [incrementBy, setIncrementBy] = useState('1');
  const [decrementBy, setDecrementBy] = useState('1');
  const [color, setColor] = useState(DefaultColor);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [minEnabled, setMinEnabled] = useState(false);
  const [maxEnabled, setMaxEnabled] = useState(false);
  const [minValue, setMinValue] = useState('0');
  const [maxValue, setMaxValue] = useState('100');
  const [goal, setGoal] = useState('');

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollContainerRef = useRef<View>(null);
  const scrollOffset = useRef(0);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const { input: focusedInput } = useReanimatedFocusedInput();
  const formHeight = useSharedValue(0);
  const addCounter = useCounterShop((state) => state.addCounter);

  // Shrink the modal from the bottom as keyboard opens
  const containerStyle = useAnimatedStyle(() => ({
    paddingBottom:
      insets.bottom - Math.min(0, keyboardHeight.value + insets.bottom),
  }));

  // Scroll container height: capped to available space, shrinks with keyboard
  const scrollContainerStyle = useAnimatedStyle(() => {
    const keyboardIntrusion = Math.max(
      0,
      -(keyboardHeight.value + insets.bottom),
    );
    const maxH =
      WINDOW_HEIGHT -
      insets.top -
      insets.bottom -
      HEADER_HEIGHT -
      FOOTER_HEIGHT -
      CARD_MARGIN * 2 -
      16 -
      keyboardIntrusion;
    const h = Math.min(formHeight.value || maxH, maxH);
    return { height: Math.max(0, h) };
  });

  const scrollToFocusedInput = () => {
    setTimeout(() => {
      if (!focusedInput.value || !scrollContainerRef.current) return;
      const layout = focusedInput.value.layout;
      if (layout.height === 0) return;
      scrollContainerRef.current.measureInWindow(
        (_x: number, svY: number, _w: number, svH: number) => {
          const inputBottom = layout.absoluteY + layout.height;
          const visibleBottom = svY + svH;
          if (inputBottom > visibleBottom) {
            scrollRef.current?.scrollTo({
              y: scrollOffset.current + (inputBottom - visibleBottom) + 20,
              animated: true,
            });
          }
        },
      );
    }, 300);
  };

  useAnimatedReaction(
    () => focusedInput.value?.target,
    (target, prev) => {
      if (target !== prev && target != null && target !== -1 && !subModalOpen) {
        runOnJS(scrollToFocusedInput)();
      }
    },
  );

  const handleSave = () => {
    if (label.trim() === '') {
      setValidationMessage('Counter name is required');
      return;
    }

    const parsedMin = minEnabled ? Number(minValue) || 0 : undefined;
    const parsedMax = maxEnabled ? Number(maxValue) || 0 : undefined;
    const parsedDefault = Number(defaultValue) || 0;

    if (parsedMin != null && parsedMax != null && parsedMin > parsedMax) {
      setValidationMessage('Min value cannot be greater than max value');
      return;
    }
    if (parsedMin != null && parsedDefault < parsedMin) {
      setValidationMessage('Default value is below minimum');
      return;
    }
    if (parsedMax != null && parsedDefault > parsedMax) {
      setValidationMessage('Default value is above maximum');
      return;
    }

    const parsedGoal = goal.trim() === '' ? undefined : Number(goal);
    if (parsedGoal != null) {
      if (parsedMin != null && parsedGoal < parsedMin) {
        setValidationMessage(`Goal must be at least ${parsedMin}`);
        return;
      }
      if (parsedMax != null && parsedGoal > parsedMax) {
        setValidationMessage(`Goal must be at most ${parsedMax}`);
        return;
      }
    }

    addCounter(
      label,
      selectedGroupId,
      {
        defaultValue: parsedDefault,
        incrementBy: Number(incrementBy) || 1,
        decrementBy: Number(decrementBy) || 1,
        minValue: parsedMin,
        maxValue: parsedMax,
        goal: parsedGoal,
      },
      {
        color,
        icon,
      },
    );

    handleClose();
  };

  const handleClose = () => {
    setLabel('');
    setDefaultValue('0');
    setIncrementBy('1');
    setDecrementBy('1');
    setModalVisible(false);
    setColor(DefaultColor);
    setIcon(undefined);
    setValidationMessage(null);
    setMinEnabled(false);
    setMaxEnabled(false);
    setMinValue('0');
    setMaxValue('100');
    setGoal('');
  };

  return (
    <View className='justify-center items-center'>
      <TouchableOpacity
        activeOpacity={0.9}
        className='bg-green-600 p-3 rounded-full h-12 w-12 justify-center items-center shadow-md shadow-green-600/50'
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome6 name='plus' size={18} color='white' />
      </TouchableOpacity>

      <Modal
        animationType='fade'
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleClose}
      >
        <Animated.View
          className='flex-1 bg-black/60 justify-center'
          style={[{ paddingTop: insets.top }, containerStyle]}
        >
          <Pressable className='flex-1 justify-center' onPress={handleClose}>
            <Pressable>
              <View className='bg-emerald-800 rounded-2xl border border-emerald-700 overflow-hidden mx-3'>
            {/* Fixed header */}
            <View className='px-6 pt-6 pb-2'>
              <Text className='text-white text-2xl font-bold'>New Counter</Text>
            </View>

            {/* Scrollable form fields */}
            <Animated.View
              ref={scrollContainerRef}
              style={scrollContainerStyle}
            >
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                keyboardShouldPersistTaps='handled'
                onScroll={(e) => {
                  scrollOffset.current = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              >
                <View
                  onLayout={(e) => {
                    formHeight.value = e.nativeEvent.layout.height;
                  }}
                >
                  <CounterAppearanceFields
                    color={color}
                    onColorChange={setColor}
                    icon={icon}
                    onIconChange={setIcon}
                    onSubModalChange={setSubModalOpen}
                  />

                  <Text className='text-emerald-300 text-md mb-1 ml-1'>
                    Name
                  </Text>
                  <VibyInput
                    className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
                    placeholder='New counter...'
                    placeholderTextColor='#a7f3d0'
                    value={label}
                    onChangeText={setLabel}
                    selectTextOnFocus={false}
                  />
                  <CounterSettingsFields
                    defaultValue={defaultValue}
                    incrementBy={incrementBy}
                    decrementBy={decrementBy}
                    goal={goal}
                    onChangeDefault={setDefaultValue}
                    onChangeIncrement={setIncrementBy}
                    onChangeDecrement={setDecrementBy}
                    onChangeGoal={setGoal}
                    minEnabled={minEnabled}
                    minValue={minValue}
                    onMinEnabledChange={setMinEnabled}
                    onMinValueChange={setMinValue}
                    maxEnabled={maxEnabled}
                    maxValue={maxValue}
                    onMaxEnabledChange={setMaxEnabled}
                    onMaxValueChange={setMaxValue}
                  />
                </View>
              </ScrollView>
            </Animated.View>

            {/* Fixed footer */}
            <View className='flex-row justify-end gap-3 px-6 py-3 border-t border-emerald-700 bg-emerald-800'>
              <TouchableOpacity
                className='bg-rose-600/60 p-3 px-6 rounded-xl'
                onPress={() => handleClose()}
              >
                <Text className='text-white font-bold'>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className='bg-lime-600 p-3 px-6 rounded-xl'
                onPress={() => handleSave()}
              >
                <Text className='text-white font-bold'>Create</Text>
              </TouchableOpacity>
            </View>
              </View>
            </Pressable>
          </Pressable>
        </Animated.View>

        <ValidationToast
          message={validationMessage}
          onDismiss={() => setValidationMessage(null)}
        />
      </Modal>
    </View>
  );
}
