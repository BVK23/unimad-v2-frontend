export interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO or human readable for mock
  isRead: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export const MOCK_CHATS: Conversation[] = [
  {
    id: "1",
    user: {
      id: "u2",
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      status: "online",
    },
    lastMessage: { id: "m1", senderId: "u2", content: "Hey, are you going to the design sync?", timestamp: "2m ago", isRead: false },
    unreadCount: 1,
    messages: [
      { id: "m0", senderId: "me", content: "Hi Sarah!", timestamp: "10:00 AM", isRead: true },
      { id: "m1", senderId: "u2", content: "Hey, are you going to the design sync?", timestamp: "10:05 AM", isRead: false },
    ],
  },
  {
    id: "2",
    user: {
      id: "u3",
      name: "Mike Ross",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
      status: "offline",
    },
    lastMessage: { id: "m2", senderId: "me", content: "Thanks for the feedback!", timestamp: "1d ago", isRead: true },
    unreadCount: 0,
    messages: [
      { id: "m3", senderId: "u3", content: "Great work on the new layout.", timestamp: "Yesterday", isRead: true },
      { id: "m2", senderId: "me", content: "Thanks for the feedback!", timestamp: "Yesterday", isRead: true },
    ],
  },
  {
    id: "3",
    user: {
      id: "u4",
      name: "Jessica Pearson",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80",
      status: "away",
    },
    lastMessage: { id: "m4", senderId: "u4", content: "Let's schedule a call.", timestamp: "3d ago", isRead: true },
    unreadCount: 0,
    messages: [{ id: "m4", senderId: "u4", content: "Let's schedule a call.", timestamp: "Mon", isRead: true }],
  },
];
