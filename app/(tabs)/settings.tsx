import { useSettingsShop } from '@/shop/settingsShop';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsSwitchRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SettingsSwitchRow({
  title,
  description,
  value,
  onValueChange,
}: SettingsSwitchRowProps) {
  return (
    <View className='flex-row items-start justify-between py-3 gap-3'>
      <View className='flex-1'>
        <Text className='text-zinc-900 text-base font-medium'>{title}</Text>
        <Text className='text-zinc-500 text-sm mt-1'>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function DuplicatePlacementRow({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const onClass = value ? 'text-emerald-700 font-semibold' : 'text-zinc-500';
  const offClass = value ? 'text-zinc-500' : 'text-emerald-700 font-semibold';

  return (
    <View className='py-3'>
      <View className='flex-row items-start justify-between gap-3'>
        <View className='flex-1'>
          <Text className='text-zinc-900 text-base font-medium'>
            Insert duplicate after original
          </Text>
          <Text className='text-zinc-500 text-sm mt-1'>
            Choose where duplicated counters are inserted.
          </Text>
        </View>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
      <View className='mt-2 pl-0.5'>
        <Text className={`text-sm ${onClass}`}>
          On: place duplicates next to the source.
        </Text>
        <Text className={`text-sm mt-1 ${offClass}`}>
          Off: place duplicates at the end of the group.
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const duplication = useSettingsShop((state) => state.duplication);
  const display = useSettingsShop((state) => state.display);
  const groups = useSettingsShop((state) => state.groups);
  const updateDuplicationSettings = useSettingsShop(
    (state) => state.updateDuplicationSettings,
  );
  const updateDisplaySettings = useSettingsShop(
    (state) => state.updateDisplaySettings,
  );
  const updateGroupSettings = useSettingsShop((state) => state.updateGroupSettings);

  return (
    <SafeAreaView className='flex-1 bg-white' edges={['top']}>
      <ScrollView className='flex-1 px-5' contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className='text-2xl font-bold text-zinc-900 mt-3 mb-1'>Settings</Text>
        <Text className='text-zinc-500 mb-6'>
          Adjust how counters behave across the app.
        </Text>

        <View className='bg-zinc-50 border border-zinc-200 rounded-2xl px-4 mb-4'>
          <Text className='text-zinc-800 font-semibold pt-4 pb-1'>Display</Text>
          <SettingsSwitchRow
            title='Keep screen on'
            description='Keep the device awake while using the app.'
            value={display.keepScreenOn}
            onValueChange={(value) => updateDisplaySettings({ keepScreenOn: value })}
          />
          <SettingsSwitchRow
            title='Haptics'
            description='Use vibration feedback on counter interactions.'
            value={display.hapticsEnabled}
            onValueChange={(value) => updateDisplaySettings({ hapticsEnabled: value })}
          />
        </View>

        <View className='bg-zinc-50 border border-zinc-200 rounded-2xl px-4 mb-4'>
          <Text className='text-zinc-800 font-semibold pt-4 pb-1'>Duplication</Text>
          <DuplicatePlacementRow
            value={duplication.insertAfterOriginal}
            onValueChange={(value) =>
              updateDuplicationSettings({ insertAfterOriginal: value })
            }
          />
          <SettingsSwitchRow
            title='Copy history when duplicating'
            description='Keep all previous history entries on duplicated counters.'
            value={duplication.copyHistory}
            onValueChange={(value) => updateDuplicationSettings({ copyHistory: value })}
          />
        </View>

        <View className='bg-zinc-50 border border-zinc-200 rounded-2xl px-4'>
          <Text className='text-zinc-800 font-semibold pt-4 pb-1'>Groups</Text>
          <SettingsSwitchRow
            title='Confirm deleting empty groups'
            description='Ask before deleting a group after moving out all counters.'
            value={groups.confirmDeleteEmpty}
            onValueChange={(value) => updateGroupSettings({ confirmDeleteEmpty: value })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
