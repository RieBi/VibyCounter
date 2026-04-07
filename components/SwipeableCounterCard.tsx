import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SharedValue } from 'react-native-reanimated';
import CounterCard from './CounterCard';

interface SwipeableCounterCardProps {
  counterId: string;
  onEdit: () => void;
  onActions: (
    id: string,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
  reorderable?: boolean;
  selected?: boolean;
  selecting?: boolean;
  onSelect?: () => void;
  didMove?: SharedValue<boolean>;
  onSwipeDelete: (id: string) => void;
  onSwipeMove: (id: string) => void;
  swipeEnabled: boolean;
  locked?: boolean;
  pendingSwipeAction?: boolean;
}

export default function SwipeableCounterCard({
  counterId,
  onEdit,
  onActions,
  reorderable,
  selected,
  selecting,
  onSelect,
  didMove,
  onSwipeDelete,
  onSwipeMove,
  swipeEnabled,
  locked = false,
  pendingSwipeAction,
}: SwipeableCounterCardProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  useEffect(() => {
    if (!pendingSwipeAction) {
      swipeableRef.current?.close();
    }
  }, [pendingSwipeAction]);

  const counterCardProps = {
    counterId,
    onEdit,
    onActions,
    reorderable,
    selected,
    selecting,
    onSelect,
    didMove,
  };

  if (!swipeEnabled || locked) {
    return <CounterCard {...counterCardProps} />;
  }

  const renderRightActions = () => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSwipeDelete(counterId)}
      className='bg-red-500 rounded-2xl justify-center items-center my-1.5 mr-3'
      style={{ width: 80 }}
    >
      <MaterialIcons name='delete' size={24} color='white' />
      <Text className='text-white text-xs font-semibold mt-1'>Delete</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = () => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        swipeableRef.current?.close();
        onSwipeMove(counterId);
      }}
      className='bg-blue-500 rounded-2xl justify-center items-center my-1.5 ml-3'
      style={{ width: 80 }}
    >
      <MaterialIcons name='drive-file-move' size={24} color='white' />
      <Text className='text-white text-xs font-semibold mt-1'>Move</Text>
    </TouchableOpacity>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      rightThreshold={80}
      leftThreshold={80}
      friction={1.5}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          onSwipeDelete(counterId);
        } else {
          swipeableRef.current?.close();
          onSwipeMove(counterId);
        }
      }}
    >
      <View>
        <CounterCard {...counterCardProps} />
      </View>
    </ReanimatedSwipeable>
  );
}
