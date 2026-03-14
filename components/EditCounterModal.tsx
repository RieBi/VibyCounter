import { useCounterShop } from '@/shop/counterShop';
import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EditCounterModalProps {
  counterId: string | null;
  onClose: () => void;
}

export default function EditCounterModal({
  counterId,
  onClose,
}: EditCounterModalProps) {
  const [label, setLabel] = useState('');

  const counterToEdit = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterId),
  );

  const updateCounter = useCounterShop((state) => state.updateCounter);

  useEffect(() => {
    if (counterToEdit) {
      setLabel(counterToEdit.label);
    }
  }, [counterToEdit]);

  const handleSave = () => {
    if (!counterId || label.trim() === '') {
      return;
    }

    updateCounter(counterId, { label });
    onClose();
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
      <View className='flex-1 justify-center items-center bg-black/60 px-4'>
        <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700 shadow-lg'>
          <Text className='text-white text-2xl font-bold mb-4'>
            Edit Counter
          </Text>

          <Text className='text-emerald-300 text-md mb-1 ml-1'>Name</Text>

          <TextInput
            className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
            placeholder='Counter name'
            placeholderTextColor='azure'
            value={label}
            onChangeText={setLabel}
          ></TextInput>

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
      </View>
    </Modal>
  );
}
