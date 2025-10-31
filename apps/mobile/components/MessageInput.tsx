import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

export default function MessageInput({ onSend }: { onSend: (text: string) => void | Promise<void> }) {
  const [text, setText] = useState('');
  return (
    <View className="flex-row items-center p-3 border-t border-gray-200 bg-white">
      <TextInput
        className="flex-1 bg-gray-100 rounded-xl px-3 py-2"
        placeholder="Type a message…"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity
        className="ml-3 px-4 py-2 rounded-xl bg-blue-600"
        onPress={async () => {
          const t = text.trim();
          if (!t) return;
          setText('');
          await onSend(t);
        }}>
        <Text className="text-white font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}
