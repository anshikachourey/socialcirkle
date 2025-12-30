import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { onMyFeed, type FeedItem } from "../../src/services/feed";

export default function FeedTab() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const off = onMyFeed(setItems);
    return () => off?.();
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="font-semibold">{item.text}</Text>
          <Text className="text-gray-500 text-xs mt-1">{item.fromUid}</Text>
        </View>
      )}
      ListEmptyComponent={
        <Text className="p-4 text-gray-500">No announcements yet.</Text>
      }
    />
  );
}
