import { useCounterShop } from '@/shop/counterShop';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EditGroupModal from './EditGroupModal';
import ValidationToast from './reusable/ValidationToast';
import VibyInput from './reusable/VibyInput';

interface GroupDrawerProps {
  visible: boolean;
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  onClose: () => void;
}

const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;
const CLOSE_THRESHOLD = DRAWER_WIDTH * 0.35;
const DURATION = 250;

export default function GroupDrawer({
  visible,
  selectedGroupId,
  onSelectGroup,
  onClose,
}: GroupDrawerProps) {
  const groups = useCounterShop((state) => state.groups);
  const addGroup = useCounterShop((state) => state.addGroup);

  const [newGroupName, setNewGroupName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const swipedClosed = useRef(false);
  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const bottomBarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: Math.min(0, keyboardHeight.value + insets.bottom),
      },
    ],
  }));

  useEffect(() => {
    if (visible) {
      swipedClosed.current = false;
      setMounted(true);
      translateX.value = withTiming(0, { duration: DURATION });
      backdropOpacity.value = withTiming(1, { duration: DURATION });
    } else if (swipedClosed.current) {
      const timeout = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(timeout);
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: DURATION });
      backdropOpacity.value = withTiming(0, { duration: DURATION });
      const timeout = setTimeout(() => setMounted(false), DURATION);
      return () => clearTimeout(timeout);
    }
  }, [backdropOpacity, translateX, visible]);

  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible, onClose]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      const clampedX = Math.min(0, e.translationX);
      translateX.value = clampedX;
      backdropOpacity.value = 1 + clampedX / DRAWER_WIDTH;
    })
    .onEnd((e) => {
      if (e.translationX < -CLOSE_THRESHOLD || e.velocityX < -500) {
        translateX.value = withTiming(-DRAWER_WIDTH, { duration: DURATION });
        backdropOpacity.value = withTiming(0, { duration: DURATION });
        swipedClosed.current = true;
        onClose();
      } else {
        translateX.value = withTiming(0, { duration: DURATION });
        backdropOpacity.value = withTiming(1, { duration: DURATION });
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleAddGroup = () => {
    const name = newGroupName.trim();

    if (name === '') {
      setValidationMessage('Group name is required');
      return;
    }

    addGroup(name);
    setNewGroupName('');
  };

  const handleSelect = (id: string) => {
    onSelectGroup(id);
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setValidationMessage(null);
    onClose();
  };

  if (!mounted) return null;

  return (
    <Pressable
      className='absolute inset-0 z-50'
      onPress={() => Keyboard.dismiss()}
    >
      <Animated.View
        style={backdropStyle}
        className='absolute inset-0 bg-black/30'
      >
        <Pressable className='flex-1' onPress={handleClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[drawerStyle, { width: DRAWER_WIDTH }]}
          className='absolute top-0 bottom-0 left-0 bg-white border-r border-zinc-200'
        >
          {/* Fixed header */}
          <Text className='text-zinc-800 text-xl font-bold p-4 pb-2'>
            Groups
          </Text>

          {/* Scrollable group list */}
          <ScrollView className='flex-1' keyboardShouldPersistTaps='handled'>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  group.id === selectedGroupId ? 'bg-zinc-100' : ''
                }`}
                onPress={() => handleSelect(group.id)}
                onLongPress={() => setEditingGroupId(group.id)}
              >
                {group.styling?.icon && (
                  <MaterialIcons
                    name={
                      group.styling.icon as keyof typeof MaterialIcons.glyphMap
                    }
                    size={20}
                    color='#3f3f46'
                  />
                )}
                <Text
                  className='text-zinc-800 text-lg flex-1 mr-2'
                  numberOfLines={1}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Fixed bottom bar, animated with keyboard */}
          <Animated.View
            style={bottomBarStyle}
            className='flex-row items-center p-4 gap-2 border-t border-zinc-200'
          >
            <VibyInput
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
          </Animated.View>
          <EditGroupModal
            groupId={editingGroupId}
            onClose={() => setEditingGroupId(null)}
            onDeleted={(id) => {
              if (id === selectedGroupId) {
                onSelectGroup(groups[0].id);
              }
            }}
          />
        </Animated.View>
      </GestureDetector>
      <ValidationToast
        message={validationMessage}
        onDismiss={() => setValidationMessage(null)}
        noInsets
      />
    </Pressable>
  );
}
