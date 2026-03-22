import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

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
  const ref = useRef<View>(null);

  const handlePress = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  };

  return (
    <View ref={ref}>
      <TouchableOpacity hitSlop={8} onPress={handlePress}>
        <MaterialIcons name='more-vert' size={20} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
