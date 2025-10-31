import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createGroup } from '../../src/services/chats';
import { useRouter } from 'expo-router';

export default function NewGroup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [raw, setRaw] = useState(''); // comma-separated uids for now

  return (
    <View className="p-4 gap-3">
      <Text className="text-xl font-bold">New Group</Text>
      <TextInput
        className="bg-gray-100 rounded-xl px-3 py-2"
        placeholder="Group name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="bg-gray-100 rounded-xl px-3 py-2"
        placeholder="Member UIDs (comma separated)"
        value={raw}
        onChangeText={setRaw}
      />
      <TouchableOpacity
        className="bg-blue-600 rounded-xl px-4 py-3 mt-4"
        onPress={async () => {
          const memberUids = raw.split(',').map(s => s.trim()).filter(Boolean);
          try {
            const chatId = await createGroup(name, memberUids);
            router.replace(`/chat/${chatId}`);
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to create group');
          }
        }}>
        <Text className="text-white text-center font-semibold">Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}
