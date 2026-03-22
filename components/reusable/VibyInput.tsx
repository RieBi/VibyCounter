import { useRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

export default function VibyInput(props: TextInputProps) {
  const ref = useRef<TextInput>(null);

  return (
    <TextInput
      ref={ref}
      selectTextOnFocus={true}
      onSelectionChange={() => {
        ref.current?.focus();
      }}
      {...props}
    />
  );
}
