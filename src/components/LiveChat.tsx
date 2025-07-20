
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
    avatarSeed: string;
  };
  text: string;
  timestamp: Date;
}

interface LiveChatProps {
  eventId: string; // Not used in mock, but good for future integration
}

const mockUsers = [
  { id: 'user1', name: 'TechFan22', avatarSeed: 'techfan' },
  { id: 'user2', name: 'MusicLover', avatarSeed: 'musiclover' },
  { id: 'user3', name: 'ArtExplorer', avatarSeed: 'artlover' },
];

const currentUser = { id: 'currentUser', name: 'You', avatarSeed: 'youavatar' };

export default function LiveChat({ eventId }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial mock messages
  useEffect(() => {
    setMessages([
      {
        id: 'msg1',
        user: mockUsers[0],
        text: 'Excited for this live event!',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        id: 'msg2',
        user: mockUsers[1],
        text: 'Anyone know who the first speaker is?',
        timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      },
    ]);
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Simulate other users sending messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const mockTexts = [
        "This is great!", 
        "Interesting point.", 
        "Can't wait for more.", 
        "Awesome!", 
        "What do you all think?"
      ];
      const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
      
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `msg-${Date.now()}`,
          user: randomUser,
          text: randomText,
          timestamp: new Date(),
        },
      ]);
    }, 15000); // New message every 15 seconds

    return () => clearInterval(interval);
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: currentUser,
      text: newMessage.trim(),
      timestamp: new Date(),
    };
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[calc(100vh-280px)] lg:h-[calc(100vh-250px)] p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3",
                  msg.user.id === currentUser.id && "justify-end"
                )}
              >
                {msg.user.id !== currentUser.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://picsum.photos/seed/${msg.user.avatarSeed}/40/40`} alt={msg.user.name} data-ai-hint="person avatar"/>
                    <AvatarFallback>{msg.user.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 text-sm",
                    msg.user.id === currentUser.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.user.id !== currentUser.id && (
                    <p className="font-semibold text-xs mb-1">{msg.user.name}</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    msg.user.id === currentUser.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                  )}>
                    {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                  </p>
                </div>
                {msg.user.id === currentUser.id && (
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://picsum.photos/seed/${msg.user.avatarSeed}/40/40`} alt={msg.user.name} data-ai-hint="person avatar"/>
                    <AvatarFallback>{msg.user.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-2">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-grow"
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
