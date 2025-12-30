import { useEffect, useState } from "react";
import { FlatList, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  onIncomingChatRequests,
  acceptChatRequest,
  declineChatRequest,
  type RelationshipRequest,
} from "../../src/services/relationships";

export default function RequestsTab() {
  const router = useRouter();
  const [items, setItems] = useState<RelationshipRequest[]>([]);

  useEffect(() => {
    const off = onIncomingChatRequests(setItems);
    return () => off?.();
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="font-semibold">New chat request</Text>
          <Text className="text-gray-600 mt-1">From: {item.fromUid}</Text>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="bg-green-600 px-4 py-2 rounded-xl"
              onPress={async () => {
                const chatId = await acceptChatRequest(item.id);
                if (chatId) router.push(`/chat/${chatId}`);
              }}
            >
              <Text className="text-white">Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-600 px-4 py-2 rounded-xl"
              onPress={async () => {
                await declineChatRequest(item.id);
              }}
            >
              <Text className="text-white">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text className="p-4 text-gray-500">No pending requests.</Text>}
    />
  );
}
