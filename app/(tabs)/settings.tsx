import { useCounterShop } from '@/shop/counterShop';
import { useSettingsShop } from '@/shop/settingsShop';
import MessageModal from '@/components/reusable/MessageModal';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ImportMode,
  VibyExportPayload,
  getExportPreview,
  pickImportPayload,
  shareExportPayload,
} from '@/vibes/importExport';
import { useState } from 'react';

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
  const buildAllExportPayload = useCounterShop((state) => state.buildAllExportPayload);
  const applyImportedPayload = useCounterShop((state) => state.applyImportedPayload);
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    payload: VibyExportPayload;
    previewLabel: string;
  } | null>(null);
  const [messageModal, setMessageModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const importWithMode = async (
    payload: VibyExportPayload,
    mode: ImportMode,
    previewLabel: string,
  ) => {
    setBusy(true);
    try {
      const summary = applyImportedPayload(payload, mode);
      setMessageModal({
        title: 'Import complete',
        message: `${previewLabel}\n\nImported ${summary.groups} groups, ${summary.counters} counters, ${summary.historyEntries} history entries.`,
      });
    } catch (error) {
      setMessageModal({
        title: 'Import failed',
        message:
          error instanceof Error ? error.message : 'Unable to import selected file.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const payload = await pickImportPayload();
      if (!payload) {
        setBusy(false);
        return;
      }

      const preview = getExportPreview(payload);
      const previewLabel = `Scope: ${payload.scope}\nGroups: ${preview.groups}\nCounters: ${preview.counters}\nHistory entries: ${preview.historyEntries}`;
      setBusy(false);
      setPendingImport({ payload, previewLabel });
    } catch (error) {
      setBusy(false);
      setMessageModal({
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Unable to read selected file.',
      });
    }
  };

  const handleExportAll = async () => {
    setBusy(true);
    try {
      const payload = buildAllExportPayload();
      await shareExportPayload(payload);
    } catch (error) {
      setMessageModal({
        title: 'Export failed',
        message: error instanceof Error ? error.message : 'Unable to export app data.',
      });
    } finally {
      setBusy(false);
    }
  };

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

        <View className='bg-zinc-50 border border-zinc-200 rounded-2xl px-4 mt-4'>
          <Text className='text-zinc-800 font-semibold pt-4 pb-3'>Data</Text>
          <TouchableOpacity
            className='bg-emerald-600 rounded-xl py-3 px-4 mb-3'
            onPress={() => void handleExportAll()}
            disabled={busy}
          >
            <Text className='text-white font-semibold text-center'>Export all data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className='bg-zinc-200 rounded-xl py-3 px-4 mb-4'
            onPress={() => void handleImport()}
            disabled={busy}
          >
            <Text className='text-zinc-800 font-semibold text-center'>Import data</Text>
          </TouchableOpacity>
          {busy && (
            <View className='pb-4 flex-row items-center gap-2'>
              <ActivityIndicator />
              <Text className='text-zinc-500'>Processing data...</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Modal
        animationType='fade'
        transparent
        visible={!!pendingImport}
        onRequestClose={() => setPendingImport(null)}
      >
        <Pressable
          className='flex-1 justify-center items-center bg-black/60 px-4'
          onPress={() => setPendingImport(null)}
        >
          <Pressable className='w-full max-w-[460px]'>
            <View className='bg-emerald-800 w-full p-6 rounded-2xl border border-emerald-700'>
              <Text className='text-white text-xl font-bold mb-2'>Import data</Text>
              <Text className='text-emerald-200 mb-4 whitespace-pre-line'>
                {pendingImport?.previewLabel}
              </Text>

              <View className='bg-emerald-900/60 border border-emerald-700 rounded-xl p-3 mb-3'>
                <Text className='text-lime-300 font-semibold'>Merge</Text>
                <Text className='text-emerald-100 text-sm mt-1'>
                  Keep your current data and add imported items. If IDs conflict, imported
                  items are remapped so nothing gets overwritten.
                </Text>
              </View>

              <View className='bg-rose-900/30 border border-rose-700 rounded-xl p-3 mb-6'>
                <Text className='text-rose-300 font-semibold'>Replace target</Text>
                <Text className='text-emerald-100 text-sm mt-1'>
                  Overwrite the affected scope from the import file. Existing data in that
                  scope is replaced.
                </Text>
              </View>

              <View className='flex-row justify-end gap-3'>
                <TouchableOpacity
                  className='bg-emerald-700 p-3 px-5 rounded-xl'
                  onPress={() => setPendingImport(null)}
                >
                  <Text className='text-white font-bold'>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-lime-600 p-3 px-5 rounded-xl'
                  onPress={() => {
                    if (!pendingImport) return;
                    const next = pendingImport;
                    setPendingImport(null);
                    void importWithMode(next.payload, 'merge', next.previewLabel);
                  }}
                >
                  <Text className='text-white font-bold'>Merge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className='bg-rose-600 p-3 px-5 rounded-xl'
                  onPress={() => {
                    if (!pendingImport) return;
                    const next = pendingImport;
                    setPendingImport(null);
                    void importWithMode(next.payload, 'replace', next.previewLabel);
                  }}
                >
                  <Text className='text-white font-bold'>Replace target</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <MessageModal
        visible={!!messageModal}
        title={messageModal?.title ?? ''}
        message={messageModal?.message ?? ''}
        onPrimary={() => setMessageModal(null)}
      />
    </SafeAreaView>
  );
}
