import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable className='flex-1 justify-center items-center bg-black/60 px-4'>
        <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700'>
          <Text className='text-white text-xl font-bold mb-2'>{title}</Text>
          <Text className='text-emerald-200 mb-6'>{message}</Text>
          <View className='flex-row justify-end gap-3'>
            <TouchableOpacity
              className='bg-emerald-700 p-3 px-6 rounded-xl'
              onPress={onCancel}
            >
              <Text className='text-white font-bold'>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className='bg-rose-600 p-3 px-6 rounded-xl'
              onPress={onConfirm}
            >
              <Text className='text-white font-bold'>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
