import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef } from 'react';
import { GestureResponderEvent, TouchableOpacity, View } from 'react-native';

interface CounterActionsMenuProps {
  iconColor: string;
  onPress: (position: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export default function CounterActionsMenu({
  iconColor,
  onPress,
}: CounterActionsMenuProps) {
  const heightRef = useRef(0);

  const handlePress = (e: GestureResponderEvent) => {
    const { pageX, pageY, locationX, locationY } = e.nativeEvent;
    onPress({
      x: pageX - locationX,
      y: pageY - locationY,
      width: 0,
      height: heightRef.current,
    });
  };

  return (
    <View onLayout={(e) => (heightRef.current = e.nativeEvent.layout.height)}>
      <TouchableOpacity hitSlop={8} onPress={handlePress}>
        <MaterialIcons name='more-vert' size={20} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
