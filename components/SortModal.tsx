import { SortDirection, SortField } from '@/vibes/definitions';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SortModalProps {
  visible: boolean;
  field: SortField;
  direction: SortDirection;
  onSelect: (field: SortField, direction: SortDirection) => void;
  onClose: () => void;
}

const SORT_OPTIONS: { field: SortField; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { field: 'manual', label: 'Manual order', icon: 'drag-handle' },
  { field: 'name', label: 'Name', icon: 'sort-by-alpha' },
  { field: 'value', label: 'Value', icon: 'tag' },
  { field: 'created', label: 'Date created', icon: 'calendar-today' },
  { field: 'lastAction', label: 'Last activity', icon: 'history' },
];

export default function SortModal({
  visible,
  field,
  direction,
  onSelect,
  onClose,
}: SortModalProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (f: SortField) => {
    if (f === 'manual') {
      onSelect('manual', 'asc');
      onClose();
      return;
    }
    if (f === field) {
      onSelect(f, direction === 'asc' ? 'desc' : 'asc');
    } else {
      onSelect(f, 'asc');
    }
    onClose();
  };

  return (
    <Modal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className='flex-1 justify-end'>
        <Pressable className='flex-1' onPress={onClose} />

        <View
          className='bg-white rounded-t-2xl border-t border-zinc-200'
          style={{ paddingBottom: insets.bottom }}
        >
          <View className='p-4 pb-2'>
            <Text className='text-zinc-800 text-xl font-bold'>Sort by</Text>
          </View>

          {SORT_OPTIONS.map((option) => {
            const isActive = option.field === field;
            return (
              <TouchableOpacity
                key={option.field}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  isActive ? 'bg-zinc-100' : ''
                }`}
                onPress={() => handleSelect(option.field)}
              >
                <MaterialIcons
                  name={option.icon}
                  size={22}
                  color={isActive ? '#059669' : '#71717a'}
                />
                <Text
                  className={`flex-1 text-base ${
                    isActive ? 'text-emerald-700 font-semibold' : 'text-zinc-700'
                  }`}
                >
                  {option.label}
                </Text>
                {isActive && option.field !== 'manual' && (
                  <MaterialIcons
                    name={direction === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                    size={20}
                    color='#059669'
                  />
                )}
                {isActive && (
                  <MaterialIcons name='check' size={20} color='#059669' />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}