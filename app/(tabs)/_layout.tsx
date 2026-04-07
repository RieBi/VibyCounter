import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(6, insets.bottom),
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Counters',
          tabBarIcon: ({ color, size }) => (
            <Feather name='hash' color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name='settings' color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
