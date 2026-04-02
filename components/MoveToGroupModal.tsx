import { useCounterShop } from '@/shop/counterShop';
import { useSettingsShop } from '@/shop/settingsShop';
import { DefaultGroup } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VibyInput from './reusable/VibyInput';

interface MoveToGroupModalProps {
  counterIds: string[];
  visible: boolean;
  onClose: () => void;
  sourceGroupId: string;
  onGroupEmptied?: (groupId: string) => void;
}

export default function MoveToGroupModal({
  counterIds,
  visible,
  onClose,
  sourceGroupId,
  onGroupEmptied,
}: MoveToGroupModalProps) {
  const [search, setSearch] = useState('');

  const groups = useCounterShop((state) => state.groups);
  const counter = useCounterShop((state) =>
    state.counters.find((c) => c.id === counterIds[0]),
  );
  const updateCounter = useCounterShop((state) => state.updateCounter);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const insets = useSafeAreaInsets();

  const handleMove = (targetGroupId: string) => {
    counterIds.forEach((id) => updateCounter(id, { groupId: targetGroupId }));

    if (
      sourceGroupId !== DefaultGroup.id &&
      useSettingsShop.getState().groups.confirmDeleteEmpty
    ) {
      const counters = useCounterShop.getState().counters;
      const remaining = counters.filter((c) => c.groupId === sourceGroupId);
      if (remaining.length === 0) {
        onGroupEmptied?.(sourceGroupId);
      }
    }

    setSearch('');
    onClose();
  };

  return (
    <Modal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={() => {
        setSearch('');
        onClose();
      }}
    >
      <View className='flex-1 justify-end'>
        <Pressable
          className='flex-1'
          onPress={() => {
            setSearch('');
            onClose();
          }}
        />
        <View
          className='bg-white rounded-t-2xl border-t border-zinc-200 h-[70%]'
          style={{ paddingBottom: insets.bottom }}
        >
          <Pressable
            className='flex-row items-center justify-between p-4 pb-2'
            onPress={Keyboard.dismiss}
          >
            <Text className='text-zinc-800 text-xl font-bold'>Move to</Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => {
                setSearch('');
                onClose();
              }}
            >
              <MaterialIcons name='close' size={24} color='#71717a' />
            </TouchableOpacity>
          </Pressable>
          <View className='px-4 pb-2'>
            <VibyInput
              className='bg-zinc-100 text-zinc-800 p-3 rounded-xl'
              placeholder='Search groups...'
              placeholderTextColor='#a1a1aa'
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView className='flex-1' keyboardShouldPersistTaps='handled'>
            {filtered.map((group) => {
              const isCurrent = group.id === counter?.groupId;
              return (
                <TouchableOpacity
                  key={group.id}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    isCurrent ? 'bg-zinc-100' : ''
                  }`}
                  onPress={() => handleMove(group.id)}
                >
                  <Text
                    className={`text-base ${
                      isCurrent ? 'text-zinc-400' : 'text-zinc-800'
                    }`}
                  >
                    {group.name}
                  </Text>
                  {isCurrent && (
                    <Text className='text-zinc-400 text-sm'>Current</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && (
              <Text className='text-zinc-400 text-center py-6'>
                No groups found
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
