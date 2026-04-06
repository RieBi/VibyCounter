import { useCounterShop } from '@/shop/counterShop';
import { DefaultColor } from '@/vibes/definitions';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import CounterAppearanceFields from './reusable/CounterAppearanceFields';
import CounterSettingsFields from './reusable/CounterSettingsFields';
import ValidationToast from './reusable/ValidationToast';
import VibyInput from './reusable/VibyInput';

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

  const addCounter = useCounterShop((state) => state.addCounter);

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
    <View className='flex-1 justify-center items-center'>
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
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps='handled'
          enabled={!subModalOpen}
        >
          <Pressable
            className='flex-1 justify-center items-center bg-black/60 px-4'
            onPress={handleClose}
          >
            <Pressable
              className='w-full'
              onPress={() => {
                Keyboard.dismiss();
              }}
            >
              <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700 shadow-lg'>
                <Text className='text-white text-2xl font-bold mb-4'>
                  New Counter
                </Text>
                <CounterAppearanceFields
                  color={color}
                  onColorChange={setColor}
                  icon={icon}
                  onIconChange={setIcon}
                  onSubModalChange={setSubModalOpen}
                />

                <Text className='text-emerald-300 text-md mb-1 ml-1'>Name</Text>
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
                <View className='flex-row justify-end gap-3'>
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
        </KeyboardAwareScrollView>
        <ValidationToast
          message={validationMessage}
          onDismiss={() => setValidationMessage(null)}
        />
      </Modal>
    </View>
  );
}
