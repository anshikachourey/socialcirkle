import { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  listIncomingRequests,
  acceptRequest,
  declineRequest,
  type RelationshipRequest
} from '../../src/services/relationships';

export default function RequestsTab() {
  const router = useRouter();
  const [items, setItems] = useState<RelationshipRequest[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listIncomingRequests('pending');
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
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="font-semibold">New chat request</Text>
          <Text className="text-gray-600 mt-1">From: {item.fromUid}</Text>
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="bg-green-600 px-4 py-2 rounded-xl"
              onPress={async () => {
                const chatId = await acceptRequest(item.id);
                await load();
                if (chatId) router.push(`/chat/${chatId}`);
              }}>
              <Text className="text-white">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-600 px-4 py-2 rounded-xl"
              onPress={async () => {
                await declineRequest(item.id);
                await load();
              }}>
              <Text className="text-white">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text className="p-4 text-gray-500">No pending requests.</Text>}
    />
  );
}
