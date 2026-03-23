import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const SUGGESTED_COLUMNS = 5;
const ALL_COLUMNS = 10;
const ALL_ITEM_SIZE = (SCREEN_WIDTH - 32 - (ALL_COLUMNS - 1) * 6) / ALL_COLUMNS;

const IconItem = memo(function IconItem({
  name,
  isSelected,
  size,
  itemSize,
  onPress,
}: {
  name: string;
  isSelected: boolean;
  size: 'suggested' | 'all';
  itemSize: number;
  onPress: (name: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(name)}
      style={{ width: itemSize, height: itemSize, margin: 3 }}
      className={`items-center justify-center rounded-xl ${
        isSelected ? 'bg-emerald-600' : 'bg-zinc-100'
      }`}
    >
      <MaterialIcons
        name={name as keyof typeof MaterialIcons.glyphMap}
        size={size === 'suggested' ? 26 : 20}
        color={isSelected ? 'white' : '#3f3f46'}
      />
      {size === 'suggested' && (
        <Text
          className={`text-[9px] mt-0.5 ${
            isSelected ? 'text-white' : 'text-zinc-400'
          }`}
          numberOfLines={1}
        >
          {name}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default function IconPickerModal({
  visible,
  selected,
  onSelect,
  onClear,
  onClose,
}: IconPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const insets = useSafeAreaInsets();

  const debounceRef = useRef<number>(0);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedSearch(text),
      250,
    ) as unknown as number;
  };

  const filtered = useMemo(() => {
    if (debouncedSearch.trim() === '') return [];
    const q = debouncedSearch.toLowerCase().replace(/\s+/g, '-');
    return ALL_ICONS.filter((name) => name.includes(q));
  }, [debouncedSearch]);

  const showSuggested = debouncedSearch.trim() === '';

  const handleSelect = useCallback(
    (icon: string) => {
      onSelect(icon);
      setSearch('');
      setDebouncedSearch('');
      onClose();
    },
    [onSelect, onClose],
  );

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const renderAllItem = useCallback(
    ({ item }: { item: string }) => (
      <IconItem
        name={item}
        isSelected={item === selected}
        size='all'
        itemSize={ALL_ITEM_SIZE}
        onPress={handleSelect}
      />
    ),
    [selected, handleSelect],
  );

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
              onChangeText={handleSearch}
              selectTextOnFocus={false}
            />
          </View>

          {/* Icon grid */}
          <FlashList
            data={showSuggested ? ALL_ICONS : filtered}
            keyExtractor={(item) => item}
            numColumns={ALL_COLUMNS}
            renderItem={renderAllItem}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            keyboardShouldPersistTaps='handled'
            ListHeaderComponent={
              showSuggested ? (
                <View>
                  <Text className='text-zinc-500 text-sm font-semibold mb-2'>
                    Suggested
                  </Text>
                  <View className='flex-row flex-wrap gap-2 mb-4'>
                    {SUGGESTED.map((name) => (
                      <IconItem
                        key={name}
                        name={name}
                        isSelected={name === selected}
                        size='suggested'
                        itemSize={
                          (SCREEN_WIDTH - 64 - (SUGGESTED_COLUMNS - 1) * 8) /
                          SUGGESTED_COLUMNS
                        }
                        onPress={handleSelect}
                      />
                    ))}
                  </View>
                  <Text className='text-zinc-500 text-sm font-semibold mb-2'>
                    All Icons
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !showSuggested ? (
                <Text className='text-zinc-400 text-center py-8'>
                  No icons matching &quot;{search}&quot;
                </Text>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}
