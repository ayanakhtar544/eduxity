import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/core/firebase/firebaseConfig";
import { Logger } from "@/core/logger";

export interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
  readBy: string[];
}

export class ChatService {
  private static activeListeners: Record<string, () => void> = {};

  static subscribeToMessages(
    chatId: string,
    onData: (messages: Message[]) => void,
    onError: (error: Error) => void,
  ) {
    this.unsubscribeFromMessages(chatId);

    Logger.info("chat.subscribe", { chatId });

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        })) as Message[];

        onData(messages.reverse());
      },
      (error) => {
        Logger.error("chat.subscribe.failed", error);
        onError(error);
      },
    );

    this.activeListeners[chatId] = unsubscribe;
  }

  static unsubscribeFromMessages(chatId: string) {
    const unsubscribe = this.activeListeners[chatId];
    if (!unsubscribe) return;

    unsubscribe();
    delete this.activeListeners[chatId];
  }

  static async sendMessage(chatId: string, senderId: string, text: string, receiverId: string) {
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      chatId,
      senderId,
      text,
      createdAt: serverTimestamp(),
      readBy: [senderId],
    });

    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      [`unreadCounts.${receiverId}`]: increment(1),
    });

    return true;
  }

  static async markAsRead(chatId: string, userId: string) {
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        [`unreadCounts.${userId}`]: 0,
      });
      return true;
    } catch (error) {
      Logger.error("chat.mark_as_read.failed", error);
      return false;
    }
  }
}
