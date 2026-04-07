import { Group } from '@/vibes/definitions';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MutableRefObject } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import VibyInput from './reusable/VibyInput';

const iconHitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};

interface IndexHeaderProps {
  // Selection
  selecting: boolean;
  selectedCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onMoveSelected: () => void;
  onDeleteSelected: () => void;
  // Search
  searching: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchAnim: SharedValue<number>;
  hasSearched: MutableRefObject<boolean>;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  // Default
  selectedGroup: Group;
  isManualOrder: boolean;
  onOpenDrawer: () => void;
  onOpenSort: () => void;
}

export default function IndexHeader({
  selecting,
  selectedCount,
  onClearSelection,
  onSelectAll,
  onMoveSelected,
  onDeleteSelected,
  searching,
  searchQuery,
  onSearchChange,
  searchAnim,
  hasSearched,
  onOpenSearch,
  onCloseSearch,
  selectedGroup,
  isManualOrder,
  onOpenDrawer,
  onOpenSort,
}: IndexHeaderProps) {
  const titleStyle = useAnimatedStyle(() => ({
    opacity: 1 - searchAnim.value,
    transform: [{ translateX: -searchAnim.value * 50 }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: searchAnim.value,
    transform: [{ translateX: (1 - searchAnim.value) * 50 }],
  }));

  return (
    <View className='flex-row items-center p-2 gap-3 h-14'>
      {/* === Selection Mode === */}
      {selecting ? (
        <View className='flex-1 flex-row items-center gap-3'>
          <TouchableOpacity
            className='bg-zinc-100 p-2 rounded-xl'
            onPress={onClearSelection}
            hitSlop={iconHitSlop}
          >
            <MaterialIcons name='arrow-back' size={22} color='#3f3f46' />
          </TouchableOpacity>
          <View className='flex-1 flex-row items-center justify-between bg-zinc-100 px-4 py-2 rounded-xl'>
            <Text
              className='flex-1 font-semibold text-lg text-zinc-700'
              style={{ lineHeight: 18 }}
            >
              {selectedCount} selected
            </Text>
            <View className='flex-row items-center gap-4'>
              <TouchableOpacity onPress={onSelectAll} hitSlop={iconHitSlop}>
                <MaterialIcons name='select-all' size={22} color='#71717a' />
              </TouchableOpacity>
              <TouchableOpacity onPress={onMoveSelected} hitSlop={iconHitSlop}>
                <MaterialIcons
                  name='drive-file-move-outline'
                  size={22}
                  color='#71717a'
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDeleteSelected} hitSlop={iconHitSlop}>
                <MaterialIcons
                  name='delete-outline'
                  size={22}
                  color='#ef4444'
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : /* === Search Mode === */
      searching ? (
        <Animated.View
          style={searchStyle}
          className='flex-1 flex-row items-center bg-zinc-100 rounded-xl px-2'
        >
          <TouchableOpacity
            onPress={onCloseSearch}
            className='p-1'
            hitSlop={iconHitSlop}
          >
            <MaterialIcons name='arrow-back' size={22} color='#71717a' />
          </TouchableOpacity>
          <VibyInput
            className='flex-1 text-zinc-800 p-2 text-base'
            placeholder='Search counters...'
            placeholderTextColor='#a1a1aa'
            value={searchQuery}
            onChangeText={onSearchChange}
            selectTextOnFocus={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              className='p-1'
              hitSlop={iconHitSlop}
            >
              <MaterialIcons name='close' size={22} color='#71717a' />
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        /* === Default Mode === */
        <Animated.View
          style={hasSearched.current ? titleStyle : undefined}
          className='flex-1 flex-row items-center gap-3'
        >
          <TouchableOpacity
            className='bg-zinc-100 p-2 rounded-xl'
            onPress={onOpenDrawer}
            hitSlop={iconHitSlop}
          >
            <AntDesign name='menu' size={22} color='#3f3f46' />
          </TouchableOpacity>

          <View className='flex-1 flex-row items-center justify-between bg-zinc-100 px-4 py-2 rounded-xl'>
            <TouchableOpacity
              onPress={onOpenSearch}
              className='flex-1 flex-row items-center'
              hitSlop={iconHitSlop}
            >
              {selectedGroup.styling?.icon && (
                <MaterialIcons
                  name={
                    selectedGroup.styling
                      .icon as keyof typeof MaterialIcons.glyphMap
                  }
                  size={18}
                  color='#52525b'
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                className='flex-1 font-semibold text-lg text-zinc-700'
                numberOfLines={1}
                style={{ lineHeight: 18 }}
              >
                {selectedGroup.name}
              </Text>
            </TouchableOpacity>
            <View className='flex-row items-center gap-3'>
              <TouchableOpacity onPress={onOpenSort} hitSlop={iconHitSlop}>
                <MaterialIcons
                  name='sort'
                  size={22}
                  color={isManualOrder ? '#71717a' : '#059669'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onOpenSearch} hitSlop={iconHitSlop}>
                <MaterialIcons name='search' size={22} color='#71717a' />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
