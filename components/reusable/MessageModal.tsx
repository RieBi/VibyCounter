import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface MessageModalProps {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function MessageModal({
  visible,
  title,
  message,
  primaryLabel = 'OK',
  onPrimary,
  secondaryLabel,
  onSecondary,
}: MessageModalProps) {
  return (
    <Modal animationType='fade' transparent visible={visible} onRequestClose={onPrimary}>
      <Pressable
        className='flex-1 justify-center items-center bg-black/60 px-4'
        onPress={onPrimary}
      >
        <Pressable className='w-full max-w-[460px]'>
          <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700'>
            <Text className='text-white text-xl font-bold mb-2'>{title}</Text>
            <Text className='text-emerald-200 mb-6 whitespace-pre-line'>{message}</Text>
            <View className='flex-row justify-end gap-3'>
              {secondaryLabel && onSecondary && (
                <TouchableOpacity
                  className='bg-emerald-700 p-3 px-6 rounded-xl'
                  onPress={onSecondary}
                >
                  <Text className='text-white font-bold'>{secondaryLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity className='bg-lime-600 p-3 px-6 rounded-xl' onPress={onPrimary}>
                <Text className='text-white font-bold'>{primaryLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
