import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <Stack screenOptions={{ headerShown: false }}></Stack>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
