import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ActionsPopupProps {
  visible: boolean;
  position: { x: number; y: number; width: number; height: number };
  onMoveTo: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export default function ActionsPopup({
  visible,
  position,
  onMoveTo,
  onDuplicate,
  onClose,
}: ActionsPopupProps) {
  const [popupHeight, setPopupHeight] = useState(0);

  const SCREEN_HEIGHT = Dimensions.get('window').height;

  const showAbove = position.y > SCREEN_HEIGHT * 0.6;

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable className='flex-1' onPress={onClose}>
        <View
          onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
          style={{
            position: 'absolute',
            top: showAbove
              ? position.y - 8
              : position.y + position.height + popupHeight + 8,
            right: 16,
            opacity: popupHeight > 0 ? 1 : 0,
          }}
          className='bg-white rounded-xl shadow-lg border border-zinc-200 min-w-[160]'
        >
          <TouchableOpacity
            className='flex-row items-center gap-3 px-4 py-3'
            onPress={onMoveTo}
          >
            <MaterialIcons
              name='drive-file-move-outline'
              size={20}
              color='#3f3f46'
            />
            <Text className='text-zinc-800 text-base'>Move to...</Text>
          </TouchableOpacity>
          <View className='border-b border-zinc-100' />
          <TouchableOpacity
            className='flex-row items-center gap-3 px-4 py-3'
            onPress={onDuplicate}
          >
            <MaterialIcons name='content-copy' size={20} color='#3f3f46' />
            <Text className='text-zinc-800 text-base'>Duplicate</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
