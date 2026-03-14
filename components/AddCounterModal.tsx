import { useCounterShop } from '@/shop/counterShop';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddCounterModal() {
  const [isModalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState('');

  const addCounter = useCounterShop((state) => state.addCounter);

  const handleSave = () => {
    if (label.trim() === '') {
      return;
    }

    addCounter(label);

    handleClose();
  };

  const handleClose = () => {
    setLabel('');
    setModalVisible(false);
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
        <View className='flex-1 justify-center items-center bg-black/60 px-4'>
          <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700 shadow-lg'>
            <Text className='text-white text-2xl font-bold mb-4'>
              New Counter
            </Text>

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
        </View>
      </Modal>
    </View>
  );
}
