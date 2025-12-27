import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { listChats, type Chat } from '../../src/services/chats';
import { useRouter } from 'expo-router';

export default function ChatsTab() {
  const router = useRouter();
  const [items, setItems] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listChats();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => router.push(`/chat/${item.id}`)}>
          <View className="px-4 py-3 border-b border-gray-200">
            <Text className="font-semibold">
              {item.isGroup ? (item.title || 'Group') : 'Direct Message'}
            </Text>
            <Text className="text-gray-600" numberOfLines={1}>
              {item.lastMessageText ?? 'No messages yet'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text className="p-4 text-gray-500">No conversations yet.</Text>}
    />
  );
}

