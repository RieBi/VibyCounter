import { useCounterShop } from '@/shop/counterShop';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CounterHistoryModal from './CounterHistoryModal';
import ConfirmModal from './reusable/ConfirmModal';
import CounterSettingsFields from './reusable/CounterSettingsFields';

interface EditCounterModalProps {
  counterId: string | null;
  onClose: () => void;
}

export default function EditCounterModal({
  counterId,
  onClose,
}: EditCounterModalProps) {
  const updateCounter = useCounterShop((state) => state.updateCounter);
  const deleteCounter = useCounterShop((state) => state.deleteCounter);
  const resetCounter = useCounterShop((state) => state.resetCounter);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);

  const [label, setLabel] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [defaultValue, setDefaultValue] = useState('0');
  const [incrementBy, setIncrementBy] = useState('1');
  const [decrementBy, setDecrementBy] = useState('1');

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
    }
  }, [counterToEdit]);

  const handleSave = () => {
    if (!counterId || label.trim() === '') {
      return;
    }

    updateCounter(counterId, {
      label,
      count: Number(currentValue) || 0,
      settings: {
        defaultValue: Number(defaultValue) || 0,
        incrementBy: Number(incrementBy) || 1,
        decrementBy: Number(decrementBy) || 1,
        allowNegative: counterToEdit?.settings.allowNegative ?? false,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (!counterId) {
      return;
    }

    deleteCounter(counterId);
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
      <Pressable
        className='flex-1 justify-center items-center bg-black/60 px-4'
        onPress={onClose}
      >
        <Pressable className='w-full'>
          <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700 shadow-lg'>
            <View className='flex-row justify-between'>
              <Text className='text-white text-2xl font-bold mb-4'>
                Edit Counter
              </Text>
              <View className='flex-row gap-4'>
                <TouchableOpacity onPress={() => setConfirmDeleteVisible(true)}>
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
            <Text className='text-emerald-300 text-md mb-1 ml-1'>Name</Text>
            <TextInput
              className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
              placeholder='Counter name'
              placeholderTextColor='azure'
              value={label}
              onChangeText={setLabel}
            ></TextInput>

            <Text className='text-emerald-300 text-sm mb-1 ml-1'>
              Current value
            </Text>

            <TextInput
              className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
              keyboardType='numeric'
              value={currentValue}
              onChangeText={setCurrentValue}
            />

            <CounterSettingsFields
              defaultValue={defaultValue}
              incrementBy={incrementBy}
              decrementBy={decrementBy}
              onChangeDefault={setDefaultValue}
              onChangeIncrement={setIncrementBy}
              onChangeDecrement={setDecrementBy}
            />
            <TouchableOpacity
              className='mb-4 self-start'
              onPress={() => setConfirmResetVisible(true)}
            >
              <Text className='text-rose-400 font-semibold'>Reset counter</Text>
            </TouchableOpacity>
            <View className='flex-row justify-end gap-3'>
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

      <CounterHistoryModal
        counter={counterToEdit}
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />

      <ConfirmModal
        visible={confirmDeleteVisible}
        title='Delete Counter'
        message={`Are you sure you want to delete counter "${counterToEdit?.label}"? This cannot be undone.`}
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
    </Modal>
  );
}
