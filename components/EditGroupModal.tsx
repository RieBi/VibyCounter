import { useCounterShop } from '@/shop/counterShop';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ConfirmModal from './reusable/ConfirmModal';
import IconPickerModal from './reusable/IconPickerModal';
import VibyInput from './reusable/VibyInput';

interface EditGroupModalProps {
  groupId: string | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function EditGroupModal({
  groupId,
  onClose,
  onDeleted,
}: EditGroupModalProps) {
  const [name, setName] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const group = useCounterShop((state) =>
    state.groups.find((g) => g.id === groupId),
  );
  const updateGroup = useCounterShop((state) => state.updateGroup);
  const softDeleteGroup = useCounterShop((state) => state.softDeleteGroup);
  const groups = useCounterShop((state) => state.groups);

  const isDefault = groupId === groups[0]?.id;

  useEffect(() => {
    if (group) {
      setName(group.name);
      setIcon(group.styling.icon);
    }
  }, [group]);

  const handleSave = () => {
    if (!groupId || name.trim() === '') return;
    updateGroup(groupId, { name: name, styling: { icon } });
    onClose();
  };

  const handleDelete = () => {
    if (!groupId) return;
    softDeleteGroup(groupId);
    setConfirmDeleteVisible(false);
    onDeleted(groupId);
    onClose();
  };

  if (!groupId) return null;

  return (
    <Modal
      animationType='fade'
      transparent
      visible={!!groupId}
      onRequestClose={onClose}
    >
      <Pressable
        className='flex-1 justify-center items-center px-4'
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <Pressable className='w-full' onPress={Keyboard.dismiss}>
          <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700 shadow-lg'>
            <View className='flex-row justify-between items-center mb-4'>
              <Text className='text-white text-2xl font-bold'>Edit Group</Text>
              {!isDefault && (
                <TouchableOpacity onPress={() => setConfirmDeleteVisible(true)}>
                  <MaterialIcons
                    color='#f87171'
                    name='delete-outline'
                    size={30}
                  />
                </TouchableOpacity>
              )}
            </View>

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

            <Text className='text-emerald-300 text-sm mb-1 ml-1'>Name</Text>

            <VibyInput
              className='bg-emerald-900 text-white p-4 rounded-xl border border-lime-600 mb-6 text-lg'
              placeholder='Group name'
              placeholderTextColor='#6ee7b7'
              value={name}
              onChangeText={setName}
            />

            <View className='flex-row justify-end gap-3'>
              <TouchableOpacity
                className='bg-rose-600/60 p-3 px-6 rounded-xl'
                onPress={onClose}
              >
                <Text className='text-white font-bold'>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className='bg-lime-600 p-3 px-6 rounded-xl'
                onPress={handleSave}
              >
                <Text className='text-white font-bold'>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>

      <ConfirmModal
        visible={confirmDeleteVisible}
        title='Delete Group'
        message={`Are you sure you want to delete "${group?.name}"? Counters in this group will be moved to the default group.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
    </Modal>
  );
}
