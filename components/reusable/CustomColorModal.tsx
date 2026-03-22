import { hexToRgb, isLightColor, rgbToHex } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ColorWheel from './ColorWheel';

interface CustomColorModalProps {
  visible: boolean;
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

function randomColor(): string {
  const r = Math.floor(Math.random() * 200) + 30;
  const g = Math.floor(Math.random() * 200) + 30;
  const b = Math.floor(Math.random() * 200) + 30;
  return rgbToHex(r, g, b);
}

export default function CustomColorModal({
  visible,
  currentColor,
  onSelect,
  onClose,
}: CustomColorModalProps) {
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  useEffect(() => {
    if (visible) {
      const [cr, cg, cb] = hexToRgb(currentColor);
      setR(cr);
      setG(cg);
      setB(cb);
    }
  }, [visible, currentColor]);

  const preview = rgbToHex(r, g, b);

  const handleRandom = () => {
    const [rr, rg, rb] = hexToRgb(randomColor());
    setR(rr);
    setG(rg);
    setB(rb);
  };

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable
          className='flex-1 justify-center items-center bg-black/60 px-4'
          onPress={onClose}
        >
          <Pressable className='w-full'>
            <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700'>
              <View className='flex-row items-center justify-between mb-4'>
                <Text className='text-white text-xl font-bold'>
                  Custom Color
                </Text>
                <TouchableOpacity onPress={handleRandom}>
                  <MaterialIcons name='casino' size={26} color='#6ee7b7' />
                </TouchableOpacity>
              </View>
              <View
                style={{ backgroundColor: preview }}
                className='h-16 rounded-xl mb-5 items-center justify-center'
              >
                <Text
                  style={{ color: isLightColor(preview) ? '#18181b' : 'white' }}
                  className='font-mono text-sm'
                >
                  {preview.toUpperCase()}
                </Text>
              </View>
              <ColorWheel
                r={r}
                g={g}
                b={b}
                onColorChange={(nr, ng, nb) => {
                  setR(nr);
                  setG(ng);
                  setB(nb);
                }}
              />
              <SliderRow label='R' value={r} onChange={setR} color='#f87171' />
              <SliderRow label='G' value={g} onChange={setG} color='#4ade80' />
              <SliderRow label='B' value={b} onChange={setB} color='#60a5fa' />
              <View className='flex-row justify-end gap-3 mt-4'>
                <TouchableOpacity
                  className='bg-rose-600/60 p-3 px-6 rounded-xl'
                  onPress={onClose}
                >
                  <Text className='text-white font-bold'>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-lime-600 p-3 px-6 rounded-xl'
                  onPress={() => onSelect(preview)}
                >
                  <Text className='text-white font-bold'>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <View className='flex-row items-center gap-3 mb-2'>
      <Text className='text-white font-bold w-4'>{label}</Text>
      <Slider
        style={{ flex: 1, height: 36 }}
        minimumValue={0}
        maximumValue={255}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor='#064e3b'
        thumbTintColor={color}
      />
      <Text className='text-emerald-300 text-sm w-8 text-right'>
        {Math.round(value)}
      </Text>
    </View>
  );
}
