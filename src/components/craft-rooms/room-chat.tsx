"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
}

interface RoomChatProps {
  roomId: string;
}

export function RoomChat({ roomId }: RoomChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // TODO: Set up Pusher subscription for real-time messages
    // For now, we'll just show a placeholder
    setMessages([
      {
        id: "1",
        senderId: "system",
        content: "Welcome to the craft room! Chat functionality will be available soon.",
        messageType: "system",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      // TODO: Implement API call to send message
      const message: Message = {
        id: Date.now().toString(),
        senderId: user.uid,
        content: newMessage.trim(),
        messageType: "text",
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (senderId: string) => {
    if (senderId === "system") return "System";
    if (senderId === user?.uid) return "You";
    return `User ${senderId.slice(-6)}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-slate-600" />
          <h3 className="font-semibold">Room Chat</h3>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-1">
              {message.messageType === "system" ? (
                <div className="text-center">
                  <div className="inline-block bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col ${
                  message.senderId === user?.uid ? "items-end" : "items-start"
                }`}>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <span>{getUserDisplayName(message.senderId)}</span>
                    <span>{formatTime(message.createdAt)}</span>
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.senderId === user?.uid
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
