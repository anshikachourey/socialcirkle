import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { getMessages, sendMessage, type Message } from '../../src/services/chats';
// ✅ fixed import path (no src/)
import MessageInput from '../../components/MessageInput';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);

  async function load() {
    if (!chatId) return;
    const data = await getMessages(String(chatId));
    setMsgs(data);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }

  useEffect(() => { load(); }, [chatId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View className="m-2 max-w-[80%] rounded-2xl px-3 py-2 self-start bg-gray-200">
            <Text>{item.text}</Text>
            <Text className="text-[10px] text-gray-500 mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
      />
      <MessageInput
        onSend={async (text) => {
          await sendMessage(String(chatId), text);
          await load();
        }}
      />
    </KeyboardAvoidingView>
  );
}

