import { Text, TextInput, View } from 'react-native';

interface CounterSettingsFieldsProps {
  defaultValue: string;
  incrementBy: string;
  decrementBy: string;
  onChangeDefault: (v: string) => void;
  onChangeIncrement: (v: string) => void;
  onChangeDecrement: (v: string) => void;
  showDefault?: boolean;
}

export default function CounterSettingsFields({
  defaultValue,
  incrementBy,
  decrementBy,
  onChangeDefault,
  onChangeIncrement,
  onChangeDecrement,
  showDefault = true,
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
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View>
      <Text className='text-emerald-300 text-sm mb-1 ml-1'>{label}</Text>
      <TextInput
        className='bg-emerald-900 text-white p-3 rounded-xl border border-lime-600 text-lg'
        keyboardType='numeric'
        value={value}
        onChangeText={onChange}
        placeholderTextColor='azure'
      />
    </View>
  );
}
