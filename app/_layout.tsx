import { useSettingsShop } from '@/shop/settingsShop';
import { initHistoryDb } from '@/data/historyDb';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import '../global.css';

const KEEP_AWAKE_TAG = 'vibycounter-keep-screen-on-setting';

export default function RootLayout() {
  const keepScreenOn = useSettingsShop((s) => s.display.keepScreenOn);

  useEffect(() => {
    initHistoryDb();
  }, []);

  useEffect(() => {
    if (keepScreenOn) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return;
    }

    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  }, [keepScreenOn]);

  useEffect(() => {
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <Stack screenOptions={{ headerShown: false }}></Stack>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
