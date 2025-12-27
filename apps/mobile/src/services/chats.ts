// src/services/chats.ts
import { api } from "../lib/api";

export type Chat = {
  id: string;
  type: "group" | "direct";
  name?: string | null;
  lastMessageText?: string | null;
  members?: string[];
  updatedAt?: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

// Flip this ON while backend is not integrated.
// If you want it auto-enabled only on web dev builds, keep it as written.
const DEMO_FALLBACK =
  (typeof window !== "undefined" && __DEV__) || process.env.EXPO_PUBLIC_DEMO_MODE === "1";

// Small helpers
function nowIso() {
  return new Date().toISOString();
}

function demoChats(): Chat[] {
  return [
    {
      id: "demo_chat_1",
      type: "direct",
      name: "Aria",
      lastMessageText: "You around?",
      members: ["me", "demo_aria"],
      updatedAt: nowIso(),
    },
    {
      id: "demo_chat_2",
      type: "group",
      name: "Zachry study group",
      lastMessageText: "Meet at 6?",
      members: ["me", "demo_aria", "demo_ryan"],
      updatedAt: nowIso(),
    },
  ];
}

function demoMessages(chatId: string): Message[] {
  return [
    { id: "m1", chatId, senderId: "demo_aria", text: "Hey!", createdAt: nowIso() },
    { id: "m2", chatId, senderId: "me", text: "What’s up", createdAt: nowIso() },
  ];
}

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Helpful when backend returns HTML/errors
    throw new Error(`Bad JSON response: ${text.slice(0, 200)}`);
  }
}

export async function listChats(): Promise<Chat[]> {
  try {
    const res = await api("/api/chats");
    if (!res.ok) {
      console.warn("[chats] listChats non-OK:", res.status);
      if (DEMO_FALLBACK) return demoChats();
      return [];
    }
    return await safeJson<Chat[]>(res);
  } catch (e) {
    console.warn("[chats] listChats failed:", e);
    if (DEMO_FALLBACK) return demoChats();
    return [];
  }
}

export async function ensureChat(otherUid: string): Promise<{ id: string }> {
  try {
    const res = await api(`/api/chats/ensure?otherId=${encodeURIComponent(otherUid)}`, {
      method: "POST",
    });
    if (!res.ok) {
      console.warn("[chats] ensureChat non-OK:", res.status);
      if (DEMO_FALLBACK) return { id: `demo_direct_${otherUid}` };
      throw new Error("Failed to ensure chat");
    }
    return await safeJson<{ id: string }>(res);
  } catch (e) {
    console.warn("[chats] ensureChat failed:", e);
    if (DEMO_FALLBACK) return { id: `demo_direct_${otherUid}` };
    throw e;
  }
}

export async function getMessages(chatId: string): Promise<Message[]> {
  try {
    const res = await api(`/api/chats/${chatId}/messages`);
    if (!res.ok) {
      console.warn("[chats] getMessages non-OK:", res.status);
      if (DEMO_FALLBACK) return demoMessages(chatId);
      return [];
    }
    return await safeJson<Message[]>(res);
  } catch (e) {
    console.warn("[chats] getMessages failed:", e);
    if (DEMO_FALLBACK) return demoMessages(chatId);
    return [];
  }
}

export async function sendMessage(chatId: string, text: string): Promise<Message> {
  try {
    const res = await api(`/api/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.warn("[chats] sendMessage non-OK:", res.status);
      if (DEMO_FALLBACK) {
        return { id: `demo_${Math.random()}`, chatId, senderId: "me", text, createdAt: nowIso() };
      }
      throw new Error("Failed to send message");
    }
    return await safeJson<Message>(res);
  } catch (e) {
    console.warn("[chats] sendMessage failed:", e);
    if (DEMO_FALLBACK) {
      return { id: `demo_${Math.random()}`, chatId, senderId: "me", text, createdAt: nowIso() };
    }
    throw e;
  }
}

export async function createGroup(name: string, memberUids: string[]): Promise<string> {
  try {
    const res = await api("/api/chats/group", {
      method: "POST",
      body: JSON.stringify({ name, memberUids }),
    });
    if (!res.ok) {
      console.warn("[chats] createGroup non-OK:", res.status);
      if (DEMO_FALLBACK) return `demo_group_${Date.now()}`;
      throw new Error("Failed to create group");
    }
    const data = await safeJson<{ id: string }>(res);
    return data.id;
  } catch (e) {
    console.warn("[chats] createGroup failed:", e);
    if (DEMO_FALLBACK) return `demo_group_${Date.now()}`;
    throw e;
  }
}
