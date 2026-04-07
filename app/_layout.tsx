import { useSettingsShop } from '@/shop/settingsShop';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';

const KEEP_AWAKE_TAG = 'vibycounter-keep-screen-on-setting';

export default function RootLayout() {
  const keepScreenOn = useSettingsShop((s) => s.display.keepScreenOn);

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
    <GestureHandlerRootView>
      <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }}></Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
