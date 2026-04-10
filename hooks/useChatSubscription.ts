// Location: hooks/useChatSubscription.ts
import { useEffect, useState } from 'react';
import { ChatService, Message } from '@/core/services/chatService';

export function useChatSubscription(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't subscribe if we don't have a valid ID
    if (!chatId) return;

    setLoading(true);

    // Start listening
    ChatService.subscribeToMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // 🚨 CRITICAL: The Cleanup Function
    // React calls this exact function when the user navigates away from the screen
    return () => {
      ChatService.unsubscribeFromMessages(chatId);
    };

  }, [chatId]); // Re-run if the chatId changes

  return { messages, loading, error };
}
