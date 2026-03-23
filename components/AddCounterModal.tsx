import { useCounterShop } from '@/shop/counterShop';
import { DefaultColor } from '@/vibes/definitions';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import ColorPickerBar from './reusable/ColorPickerBar';
import CounterSettingsFields from './reusable/CounterSettingsFields';
import IconPickerModal from './reusable/IconPickerModal';
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
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const addCounter = useCounterShop((state) => state.addCounter);

  const handleSave = () => {
    if (label.trim() === '') {
      return;
    }

    addCounter(
      label,
      selectedGroupId,
      {
        defaultValue: Number(defaultValue) || 0,
        incrementBy: Number(incrementBy) || 1,
        decrementBy: Number(decrementBy) || 1,
        allowNegative: false,
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
                <ColorPickerBar selected={color} onSelect={setColor} />

                <Text className='text-emerald-300 text-sm mb-1 ml-1'>Icon</Text>
                <TouchableOpacity
                  className='flex-row items-center gap-3 bg-emerald-900 p-4 rounded-xl border border-lime-600 mb-4'
                  onPress={() => setIconPickerVisible(true)}
                >
                  {icon ? (
                    <MaterialIcons
                      name={icon as keyof typeof MaterialIcons.glyphMap}
                      size={24}
                      color='white'
                    />
                  ) : (
                    <MaterialIcons
                      name='add-circle-outline'
                      size={24}
                      color='#6ee7b7'
                    />
                  )}
                  <Text className={icon ? 'text-white' : 'text-emerald-300'}>
                    {icon ?? 'Choose an icon'}
                  </Text>
                </TouchableOpacity>

                <IconPickerModal
                  visible={iconPickerVisible}
                  selected={icon}
                  onSelect={setIcon}
                  onClear={() => setIcon(undefined)}
                  onClose={() => setIconPickerVisible(false)}
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
                  onChangeDefault={setDefaultValue}
                  onChangeIncrement={setIncrementBy}
                  onChangeDecrement={setDecrementBy}
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
      </Modal>
    </View>
  );
}
