import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useSearch() {
  const searchAnim = useSharedValue(0);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasSearched = useRef(false);

  const openSearch = useCallback(() => {
    hasSearched.current = true;
    setSearching(true);
    searchAnim.value = withTiming(1, { duration: 200 });
  }, [searchAnim]);

  const closeSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
    searchAnim.value = withTiming(0, { duration: 200 });
    setTimeout(() => setSearching(false), 200);
  }, [searchAnim]);

  useEffect(() => {
    if (!searching) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSearch();
      return true;
    });
    return () => sub.remove();
  }, [closeSearch, searching]);

  return {
    searching,
    searchQuery,
    setSearchQuery,
    searchAnim,
    hasSearched,
    openSearch,
    closeSearch,
  };
}
