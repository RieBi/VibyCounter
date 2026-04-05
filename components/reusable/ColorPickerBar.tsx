import { isLightColor } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import CustomColorModal from './CustomColorModal';

function randomColor(): string {
  const ch = () =>
    (Math.floor(Math.random() * 200) + 30).toString(16).padStart(2, '0');
  return `#${ch()}${ch()}${ch()}`;
}

const PRESETS = [
  '#0e7490',
  '#0d9488',
  '#059669',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#9333ea',
  '#4f46e5',
  '#2563eb',
  '#475569',
];

interface ColorPickerBarProps {
  selected: string;
  onSelect: (color: string) => void;
  onCustomModalChange?: (open: boolean) => void;
}

export default function ColorPickerBar({
  selected,
  onSelect,
  onCustomModalChange,
}: ColorPickerBarProps) {
  const [customVisible, setCustomVisible] = useState(false);

  const isPreset = PRESETS.includes(selected);

  const openCustom = () => {
    setCustomVisible(true);
    onCustomModalChange?.(true);
  };

  const closeCustom = () => {
    setCustomVisible(false);
    onCustomModalChange?.(false);
  };

  return (
    <View className='flex-row items-center flex-wrap gap-2 mb-4'>
      {PRESETS.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelect(color)}
          style={{ backgroundColor: color }}
          className='h-8 w-8 rounded-full items-center justify-center border border-white/30'
        >
          {selected === color && (
            <MaterialIcons name='check' size={16} color='white' />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={() => onSelect(randomColor())}
        className='h-8 w-8 rounded-full items-center justify-center border-2 border-dashed border-emerald-400'
      >
        <MaterialIcons name='casino' size={16} color='#6ee7b7' />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openCustom}
        style={!isPreset ? { backgroundColor: selected } : undefined}
        className={`h-8 w-8 rounded-full items-center justify-center ${
          isPreset
            ? 'border-2 border-dashed border-emerald-400'
            : 'border border-white/30'
        }`}
      >
        <MaterialIcons
          name='colorize'
          size={16}
          color={
            isPreset ? '#6ee7b7' : isLightColor(selected) ? '#18181b' : 'white'
          }
        />
      </TouchableOpacity>

      <CustomColorModal
        visible={customVisible}
        currentColor={selected}
        onSelect={(color) => {
          onSelect(color);
          closeCustom();
        }}
        onClose={closeCustom}
      />
    </View>
  );
}
