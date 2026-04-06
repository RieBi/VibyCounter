import { Switch, Text, View } from 'react-native';
import VibyInput from './VibyInput';

interface CounterSettingsFieldsProps {
  defaultValue: string;
  incrementBy: string;
  decrementBy: string;
  onChangeDefault: (v: string) => void;
  onChangeIncrement: (v: string) => void;
  onChangeDecrement: (v: string) => void;
  goal: string;
  onChangeGoal: (v: string) => void;
  showDefault?: boolean;
  minEnabled: boolean;
  minValue: string;
  onMinEnabledChange: (v: boolean) => void;
  onMinValueChange: (v: string) => void;
  maxEnabled: boolean;
  maxValue: string;
  onMaxEnabledChange: (v: boolean) => void;
  onMaxValueChange: (v: string) => void;
}

export default function CounterSettingsFields({
  defaultValue,
  incrementBy,
  decrementBy,
  onChangeDefault,
  onChangeIncrement,
  onChangeDecrement,
  goal,
  onChangeGoal,
  showDefault = true,
  minEnabled,
  minValue,
  onMinEnabledChange,
  onMinValueChange,
  maxEnabled,
  maxValue,
  onMaxEnabledChange,
  onMaxValueChange,
}: CounterSettingsFieldsProps) {
  return (
    <View className='gap-3 mb-6'>
      {showDefault && (
        <Field
          label='Default value'
          value={defaultValue}
          onChange={onChangeDefault}
        />
      )}
      <Field label='Goal' value={goal} onChange={onChangeGoal} placeholder='No goal' />
      <View className='flex-row gap-3'>
        <View className='flex-1'>
          <Field
            label='Increment by'
            value={incrementBy}
            onChange={onChangeIncrement}
          />
        </View>
        <View className='flex-1'>
          <Field
            label='Decrement by'
            value={decrementBy}
            onChange={onChangeDecrement}
          />
        </View>
      </View>
      <View className='flex-row gap-3'>
        <View className='flex-1'>
          <ToggleField
            label='Min value'
            enabled={minEnabled}
            onToggle={onMinEnabledChange}
            value={minValue}
            onChange={onMinValueChange}
          />
        </View>
        <View className='flex-1'>
          <ToggleField
            label='Max value'
            enabled={maxEnabled}
            onToggle={onMaxEnabledChange}
            value={maxValue}
            onChange={onMaxValueChange}
          />
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Text className='text-emerald-300 text-sm mb-1 ml-1'>{label}</Text>
      <VibyInput
        className='bg-emerald-900 text-white p-3 rounded-xl border border-lime-600 text-lg'
        keyboardType='numeric'
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor='#6b7280'
      />
    </View>
  );
}

function ToggleField({
  label,
  enabled,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <View className='flex-row items-center justify-between mb-1 ml-1'>
        <Text className='text-emerald-300 text-sm'>{label}</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#064e3b', true: '#65a30d' }}
          thumbColor={enabled ? '#ecfccb' : '#6b7280'}
        />
      </View>
      {enabled && (
        <VibyInput
          className='bg-emerald-900 text-white p-3 rounded-xl border border-lime-600 text-lg'
          keyboardType='numeric'
          value={value}
          onChangeText={onChange}
          placeholderTextColor='azure'
        />
      )}
    </View>
  );
}
