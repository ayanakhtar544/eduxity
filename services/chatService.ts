// Location: services/chatService.ts
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  getDocs
} from 'firebase/firestore';
import { db } from '@/core/firebase/firebaseConfig';
import { Logger } from '@/core/logger';

// Type definitions for strong contracts
export interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any; // Firestore Timestamp
  readBy: string[];
}

export class ChatService {
  // 🚨 CRITICAL: Store active listeners to prevent duplicates and memory leaks
  private static activeListeners: Record<string, () => void> = {};

  /**
   * Safely subscribes to a chat room's messages.
   * Guarantees only one active listener per chatId.
   */
  static subscribeToMessages(
    chatId: string, 
    onData: (messages: Message[]) => void,
    onError: (error: any) => void
  ) {
    // 1. Cleanup any existing listener for this chat before starting a new one
    this.unsubscribeFromMessages(chatId);

    Logger.info("ChatService: Subscribing to messages", { chatId });

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    
    // 2. Query: Ordered chronologically, limited to prevent massive initial payloads
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'), // Fetch newest first for efficient pagination
      limit(50)
    );

    // 3. Attach listener and store the unsubscribe function
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as Message);
        });
        
        // Reverse so the UI renders them top-to-bottom chronologically
        onData(messages.reverse());
      },
      (error) => {
        Logger.error("ChatService: Subscription error", error);
        onError(error);
      }
    );

    this.activeListeners[chatId] = unsubscribe;
  }

  /**
   * Safely detaches a listener and clears memory.
   */
  static unsubscribeFromMessages(chatId: string) {
    if (this.activeListeners[chatId]) {
      Logger.info("ChatService: Unsubscribing from messages", { chatId });
      this.activeListeners[chatId](); // Call the Firebase unsubscribe function
      delete this.activeListeners[chatId];
    }
  }

  /**
   * Sends a message and safely increments the unread counter.
   */
  static async sendMessage(chatId: string, senderId: string, text: string, receiverId: string) {
    try {
      // 1. Add the actual message
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        chatId,
        senderId,
        text,
        createdAt: serverTimestamp(),
        readBy: [senderId] // Sender has inherently read their own message
      });

      // 2. 🚨 CRITICAL: Use increment() to avoid race conditions on counters
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        // Increment the receiver's unread count safely
        [`unreadCounts.${receiverId}`]: increment(1) 
      });

      Logger.info("ChatService: Message sent successfully");
      return true;
    } catch (error) {
      Logger.error("ChatService: Failed to send message", error);
      throw error;
    }
  }

  /**
   * Marks a chat as read by resetting the specific user's counter to 0.
   */
  static async markAsRead(chatId: string, userId: string) {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCounts.${userId}`]: 0
      });
      return true;
    } catch (error) {
      Logger.error("ChatService: Failed to mark as read", error);
      return false; // Fail silently for UX, but log it
    }
  }
}