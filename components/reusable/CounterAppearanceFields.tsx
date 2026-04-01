import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Keyboard, Text, TouchableOpacity } from 'react-native';
import ColorPickerBar from './ColorPickerBar';
import IconPickerModal from './IconPickerModal';

interface CounterAppearanceFieldsProps {
  color: string;
  onColorChange: (color: string) => void;
  icon: string | undefined;
  onIconChange: (icon: string | undefined) => void;
  onSubModalChange: (open: boolean) => void;
}

export default function CounterAppearanceFields({
  color,
  onColorChange,
  icon,
  onIconChange,
  onSubModalChange,
}: CounterAppearanceFieldsProps) {
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const openIconPicker = () => {
    onSubModalChange(true);
    setIconPickerVisible(true);
  };

  const closeIconPicker = () => {
    Keyboard.dismiss();
    setIconPickerVisible(false);
    setTimeout(() => onSubModalChange(false), 300);
  };

  return (
    <>
      <ColorPickerBar
        selected={color}
        onSelect={onColorChange}
        onCustomModalChange={(open) => {
          if (open) onSubModalChange(true);
          else setTimeout(() => onSubModalChange(false), 300);
        }}
      />

      <Text className='text-emerald-300 text-sm mb-1 ml-1'>Icon</Text>
      <TouchableOpacity
        className='flex-row items-center gap-3 bg-emerald-900 p-4 rounded-xl border border-lime-600 mb-4'
        onPress={openIconPicker}
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
        onSelect={(i) => {
          onIconChange(i);
          closeIconPicker();
        }}
        onClear={() => {
          onIconChange(undefined);
          closeIconPicker();
        }}
        onClose={closeIconPicker}
      />
    </>
  );
}
