import { useCounterShop } from '@/shop/counterShop';
import { DefaultColor } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CounterHistoryModal from './CounterHistoryModal';
import ConfirmModal from './reusable/ConfirmModal';
import CounterAppearanceFields from './reusable/CounterAppearanceFields';
import CounterSettingsFields from './reusable/CounterSettingsFields';
import ValidationToast from './reusable/ValidationToast';
import VibyInput from './reusable/VibyInput';

interface EditCounterModalProps {
  counterId: string | null;
  onClose: () => void;
}

export default function EditCounterModal({
  counterId,
  onClose,
}: EditCounterModalProps) {
  const updateCounter = useCounterShop((state) => state.updateCounter);
  const softDeleteCounter = useCounterShop((state) => state.softDeleteCounter);
  const resetCounter = useCounterShop((state) => state.resetCounter);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);

  const [label, setLabel] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
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
  const [locked, setLocked] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollContainerRef = useRef<View>(null);
  const scrollOffset = useRef(0);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const { input: focusedInput } = useReanimatedFocusedInput();

  // Shrink the modal from the bottom as keyboard opens
  const containerStyle = useAnimatedStyle(() => ({
    paddingBottom:
      insets.bottom - Math.min(0, keyboardHeight.value + insets.bottom),
  }));

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

  const counterToEdit = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  useEffect(() => {
    if (counterToEdit) {
      setLabel(counterToEdit.label);
      setCurrentValue(String(counterToEdit.count));
      setDefaultValue(String(counterToEdit.settings.defaultValue ?? 0));
      setIncrementBy(String(counterToEdit.settings.incrementBy ?? 1));
      setDecrementBy(String(counterToEdit.settings.decrementBy ?? 1));
      setColor(counterToEdit.styling.color ?? DefaultColor);
      setIcon(counterToEdit.styling.icon);
      setMinEnabled(counterToEdit.settings.minValue != null);
      setMinValue(String(counterToEdit.settings.minValue ?? 0));
      setMaxEnabled(counterToEdit.settings.maxValue != null);
      setMaxValue(String(counterToEdit.settings.maxValue ?? 100));
      setGoal(
        counterToEdit.settings.goal != null
          ? String(counterToEdit.settings.goal)
          : '',
      );
      setLocked(counterToEdit.locked ?? false);
      setValidationMessage(null);
    }
  }, [counterToEdit]);

  const handleSave = () => {
    if (!counterId) return;

    if (label.trim() === '') {
      setValidationMessage('Counter name is required');
      return;
    }

    const parsedMin = minEnabled ? Number(minValue) || 0 : undefined;
    const parsedMax = maxEnabled ? Number(maxValue) || 0 : undefined;
    const parsedCurrent = Number(currentValue) || 0;
    const parsedDefault = Number(defaultValue) || 0;

    if (parsedMin != null && parsedMax != null && parsedMin > parsedMax) {
      setValidationMessage('Min value cannot be greater than max value');
      return;
    }
    if (parsedMin != null && parsedCurrent < parsedMin) {
      setValidationMessage('Current value is below minimum');
      return;
    }
    if (parsedMax != null && parsedCurrent > parsedMax) {
      setValidationMessage('Current value is above maximum');
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

    updateCounter(counterId, {
      label,
      count: parsedCurrent,
      locked,
      settings: {
        defaultValue: parsedDefault,
        incrementBy: Number(incrementBy) || 1,
        decrementBy: Number(decrementBy) || 1,
        minValue: parsedMin,
        maxValue: parsedMax,
        goal: parsedGoal,
      },
      styling: {
        color: color,
        icon,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (!counterId) {
      return;
    }

    softDeleteCounter(counterId);
    setConfirmDeleteVisible(false);
    onClose();
  };

  const handleReset = () => {
    if (!counterId) {
      return;
    }

    resetCounter(counterId);
    setConfirmResetVisible(false);
  };

  if (!counterId) {
    return null;
  }

  return (
    <Modal
      animationType='fade'
      transparent={true}
      visible={!!counterId}
      onRequestClose={onClose}
    >
      <Animated.View
        className='flex-1 bg-black/60'
        style={[{ paddingTop: insets.top }, containerStyle]}
      >
        <Pressable className='flex-1' onPress={onClose}>
          <Pressable className='flex-1'>
            <View className='flex-1 bg-emerald-800 rounded-2xl border border-emerald-700 overflow-hidden mx-3 my-1'>
              {/* Fixed header */}
              <View className='flex-row justify-between items-center px-6 pt-6 pb-2'>
                <Text className='text-white text-2xl font-bold'>
                  Edit Counter
                </Text>
                <View className='flex-row gap-4'>
                  <TouchableOpacity
                    disabled={locked}
                    onPress={() => {
                      if (locked) return;
                      setConfirmDeleteVisible(true);
                    }}
                    style={{ opacity: locked ? 0.35 : 1 }}
                  >
                    <MaterialIcons
                      color='#f87171'
                      name='delete-outline'
                      size={30}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setHistoryVisible(true)}>
                    <MaterialIcons color='#EBF4FA' name='history' size={32} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable form fields */}
              <View ref={scrollContainerRef} style={{ flex: 1 }}>
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
                    placeholder='Counter name'
                    placeholderTextColor='azure'
                    value={label}
                    onChangeText={setLabel}
                  />
                  <Text className='text-emerald-300 text-sm mb-1 ml-1'>
                    Current value
                  </Text>
                  <VibyInput
                    className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
                    keyboardType='numeric'
                    value={currentValue}
                    onChangeText={setCurrentValue}
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

                  <View className='flex-row items-start justify-between py-3 gap-3 mb-2 border-t border-emerald-700/50 mt-2'>
                    <View className='flex-1 pr-2'>
                      <Text className='text-emerald-200 text-base font-medium'>
                        Lock counter
                      </Text>
                      <Text className='text-emerald-400/90 text-sm mt-1'>
                        Prevents changing the value from the list and swipe delete
                        until you unlock here.
                      </Text>
                    </View>
                    <Switch
                      value={locked}
                      onValueChange={setLocked}
                      trackColor={{ false: '#065f46', true: '#84cc16' }}
                      thumbColor='#f0fdf4'
                    />
                  </View>

                  <TouchableOpacity
                    className='mb-4 self-start'
                    disabled={locked}
                    onPress={() => {
                      if (locked) return;
                      setConfirmResetVisible(true);
                    }}
                  >
                    <Text
                      className={`font-semibold ${locked ? 'text-rose-400/40' : 'text-rose-400'}`}
                    >
                      Reset counter
                    </Text>
                  </TouchableOpacity>
                  {locked && (
                    <Text className='text-emerald-400/80 text-sm mb-4'>
                      Unlock to reset or delete this counter.
                    </Text>
                  )}
                </ScrollView>
              </View>

              {/* Fixed footer */}
              <View className='flex-row justify-end gap-3 px-6 py-3 border-t border-emerald-700 bg-emerald-800'>
                <TouchableOpacity
                  className='bg-rose-600/60 p-3 px-6 rounded-xl'
                  onPress={() => onClose()}
                >
                  <Text className='text-white font-bold'>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-lime-600 p-3 px-6 rounded-xl'
                  onPress={() => handleSave()}
                >
                  <Text className='text-white font-bold'>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Animated.View>

      <CounterHistoryModal
        counter={counterToEdit}
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />

      <ConfirmModal
        visible={confirmDeleteVisible}
        title='Delete Counter'
        message={`Are you sure you want to delete counter "${counterToEdit?.label}"?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
      <ConfirmModal
        visible={confirmResetVisible}
        title='Reset Counter'
        message={`Are you sure you want to reset counter "${counterToEdit?.label}"?`}
        confirmLabel='Reset'
        onConfirm={handleReset}
        onCancel={() => setConfirmResetVisible(false)}
      />

      <ValidationToast
        message={validationMessage}
        onDismiss={() => setValidationMessage(null)}
      />
    </Modal>
  );
}
