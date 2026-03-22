import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import CustomColorModal from './CustomColorModal';

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
}

export default function ColorPickerBar({
  selected,
  onSelect,
}: ColorPickerBarProps) {
  const [customVisible, setCustomVisible] = useState(false);

  const isPreset = PRESETS.includes(selected);

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
        onPress={() => setCustomVisible(true)}
        style={!isPreset ? { backgroundColor: selected } : undefined}
        className={`h-8 w-8 rounded-full items-center justify-center ${
          isPreset ? 'border-2 border-dashed border-emerald-400' : ''
        }`}
      >
        <MaterialIcons
          name='colorize'
          size={16}
          color={isPreset ? '#6ee7b7' : 'white'}
        />
      </TouchableOpacity>

      <CustomColorModal
        visible={customVisible}
        currentColor={selected}
        onSelect={(color) => {
          onSelect(color);
          setCustomVisible(false);
        }}
        onClose={() => setCustomVisible(false)}
      />
    </View>
  );
}
