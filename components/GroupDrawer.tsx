import { useCounterShop } from '@/shop/counterShop';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface GroupDrawerProps {
  visible: boolean;
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  onClose: () => void;
}

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;
const DURATION = 250;

export default function GroupDrawer({
  visible,
  selectedGroupId,
  onSelectGroup,
  onClose,
}: GroupDrawerProps) {
  const groups = useCounterShop((state) => state.groups);
  const addGroup = useCounterShop((state) => state.addGroup);
  const deleteGroup = useCounterShop((state) => state.deleteGroup);

  const [newGroupName, setNewGroupName] = useState('');
  const [mounted, setMounted] = useState(false);

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: DURATION });
      backdropOpacity.value = withTiming(1, { duration: DURATION });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: DURATION });
      backdropOpacity.value = withTiming(0, { duration: DURATION });
      const timeout = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(timeout);
    }
  }, [backdropOpacity, translateX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (name === '') return;
    addGroup(name);
    setNewGroupName('');
  };

  const handleSelect = (id: string) => {
    onSelectGroup(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteGroup(id);

    if (id === selectedGroupId) {
      handleSelect(groups[0].id);
    }
  };

  if (!mounted) return null;

  return (
    <View className='absolute inset-0 z-50'>
      <Animated.View
        style={backdropStyle}
        className='absolute inset-0 bg-black/30'
      >
        <Pressable className='flex-1' onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[drawerStyle, { width: DRAWER_WIDTH }]}
        className='absolute top-0 bottom-0 left-0 bg-white border-r border-zinc-200'
      >
        <View className='flex-1'>
          <Text className='text-zinc-800 text-xl font-bold p-4 pb-2'>
            Groups
          </Text>

          <View className='flex-1'>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  group.id === selectedGroupId ? 'bg-zinc-100' : ''
                }`}
                onPress={() => handleSelect(group.id)}
              >
                <Text className='text-zinc-800 text-lg'>{group.name}</Text>
                {group.id !== groups[0]?.id && (
                  <TouchableOpacity
                    onPress={() => handleDelete(group.id)}
                    hitSlop={8}
                  >
                    <MaterialIcons
                      name='delete-outline'
                      size={20}
                      color='#ef4444'
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View className='flex-row items-center p-4 gap-2 border-t border-zinc-200'>
            <TextInput
              className='flex-1 bg-zinc-100 text-zinc-800 p-3 rounded-xl'
              placeholder='New group...'
              placeholderTextColor='#a1a1aa'
              value={newGroupName}
              onChangeText={setNewGroupName}
              onSubmitEditing={handleAddGroup}
            />
            <TouchableOpacity
              className='bg-emerald-600 p-3 rounded-xl'
              onPress={handleAddGroup}
            >
              <MaterialIcons name='add' size={22} color='white' />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
