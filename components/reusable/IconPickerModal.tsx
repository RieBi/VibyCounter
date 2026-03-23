import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VibyInput from './VibyInput';

interface IconPickerModalProps {
  visible: boolean;
  selected?: string;
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const SUGGESTED = [
  'star',
  'favorite',
  'home',
  'work',
  'school',
  'fitness-center',
  'shopping-cart',
  'restaurant',
  'local-cafe',
  'pets',
  'music-note',
  'sports-esports',
  'directions-run',
  'code',
  'brush',
  'flight',
  'attach-money',
  'local-hospital',
  'menu-book',
  'emoji-events',
  'self-improvement',
  'water-drop',
  'bedtime',
  'eco',
];

const ALL_ICONS = Object.keys(
  MaterialIcons.glyphMap,
).sort() as (keyof typeof MaterialIcons.glyphMap)[];

const COLUMNS = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - (COLUMNS - 1) * 8) / COLUMNS;

export default function IconPickerModal({
  visible,
  selected,
  onSelect,
  onClear,
  onClose,
}: IconPickerModalProps) {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    if (search.trim() === '') return [];
    const q = search.toLowerCase().replace(/\s+/g, '-');
    return ALL_ICONS.filter((name) => name.includes(q));
  }, [search]);

  const showSuggested = search.trim() === '';

  const handleSelect = (icon: string) => {
    onSelect(icon);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const renderIcon = (name: string) => {
    const isSelected = name === selected;
    return (
      <TouchableOpacity
        key={name}
        onPress={() => handleSelect(name)}
        style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        className={`items-center justify-center rounded-xl ${
          isSelected ? 'bg-emerald-600' : 'bg-zinc-100'
        }`}
      >
        <MaterialIcons
          name={name as keyof typeof MaterialIcons.glyphMap}
          size={26}
          color={isSelected ? 'white' : '#3f3f46'}
        />
        <Text
          className={`text-[9px] mt-0.5 ${
            isSelected ? 'text-white' : 'text-zinc-400'
          }`}
          numberOfLines={1}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType='slide'
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className='flex-1 justify-end'>
        <Pressable className='flex-1' onPress={handleClose} />

        <View
          className='bg-white rounded-t-2xl border-t border-zinc-200 h-[75%]'
          style={{ paddingBottom: insets.bottom }}
        >
          {/* Header */}
          <View className='flex-row items-center justify-between p-4 pb-2'>
            <Text className='text-zinc-800 text-xl font-bold'>Choose Icon</Text>
            <View className='flex-row items-center gap-3'>
              {selected && (
                <TouchableOpacity
                  onPress={() => {
                    onClear();
                    setSearch('');
                    onClose();
                  }}
                >
                  <Text className='text-rose-500 font-semibold text-sm'>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity hitSlop={8} onPress={handleClose}>
                <MaterialIcons name='close' size={24} color='#71717a' />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View className='px-4 pb-3'>
            <VibyInput
              className='bg-zinc-100 text-zinc-800 p-3 rounded-xl'
              placeholder='Search icons...'
              placeholderTextColor='#a1a1aa'
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Icon grid */}
          {showSuggested ? (
            <FlatList
              data={SUGGESTED}
              keyExtractor={(item) => item}
              numColumns={COLUMNS}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              keyboardShouldPersistTaps='handled'
              ListHeaderComponent={
                <Text className='text-zinc-500 text-sm font-semibold mb-2'>
                  Suggested
                </Text>
              }
              ListFooterComponent={
                <Text className='text-zinc-400 text-xs text-center mt-4 mb-2'>
                  Search to browse all {ALL_ICONS.length} icons
                </Text>
              }
              renderItem={({ item }) => renderIcon(item)}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              numColumns={COLUMNS}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              keyboardShouldPersistTaps='handled'
              ListEmptyComponent={
                <Text className='text-zinc-400 text-center py-8'>
                  No icons matching &quot;{search}&quot;
                </Text>
              }
              renderItem={({ item }) => renderIcon(item)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
