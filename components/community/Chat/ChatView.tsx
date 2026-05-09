import React, { useState } from "react";
import { Search, MoreVertical, Phone, Video, Send, ArrowLeft, Smile, Paperclip } from "lucide-react";
import Image from "next/image";
import { MOCK_CHATS, Conversation } from "./ChatHelper";

interface ChatViewProps {
  initialUserId?: string | null;
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ initialUserId, onBack }) => {
  // Determine initial chat based on userId passed
  // If no specific user is targeted, start with NULL so mobile users see the list first
  const startChat = initialUserId ? (MOCK_CHATS.find(c => c.user.id === initialUserId) ?? null) : null;

  const [selectedChat, setSelectedChat] = useState<Conversation | null>(startChat);
  const [messageInput, setMessageInput] = useState("");

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm h-[calc(100vh-140px)] min-h-[600px] flex">
      {/* LEFT SIDEBAR - Chat List */}
      <div
        className={`w-full md:w-72 border-r border-slate-200 dark:border-white/5 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex justify-between items-center">
            <h2 className="font-medium text-lg text-slate-900 dark:text-white">Messages</h2>
            <button className="text-slate-400 hover:text-brand-500">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {MOCK_CHATS.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-3 mx-2 rounded-lg flex gap-3 cursor-pointer transition-colors ${
                selectedChat?.id === chat.id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image src={chat.user.avatar} alt={chat.user.name} fill sizes="40px" className="object-cover" />
                {chat.user.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1a1a1a] rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3
                    className={`text-sm font-medium truncate ${selectedChat?.id === chat.id ? "text-brand-700 dark:text-brand-400" : "text-slate-900 dark:text-white"}`}
                  >
                    {chat.user.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">{chat.lastMessage.timestamp}</span>
                </div>
                <p
                  className={`text-xs truncate ${chat.unreadCount > 0 ? "font-medium text-slate-800 dark:text-slate-200" : "text-slate-500"}`}
                >
                  {chat.lastMessage.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - Active Chat */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0a0a0a]">
          {/* Chat Header */}
          <div className="h-16 px-4 bg-white dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-500 hover:text-slate-900">
                <ArrowLeft size={20} />
              </button>
              <div className="relative w-9 h-9 rounded-full overflow-hidden">
                <Image src={selectedChat.user.avatar} alt="" fill sizes="36px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-none">{selectedChat.user.name}</h3>
                <p className="text-xs text-brand-500 font-medium mt-1">{selectedChat.user.status === "online" ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex gap-4 text-slate-400">
              <Phone size={20} className="hover:text-brand-500 cursor-pointer" />
              <Video size={20} className="hover:text-brand-500 cursor-pointer" />
              <MoreVertical size={20} className="hover:text-brand-500 cursor-pointer" />
            </div>
          </div>

          {/* Chat Messages Area (Reddit/Discord Style) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today</span>
              <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
            </div>

            {selectedChat.messages.map((msg, index) => {
              const isMe = msg.senderId === "me";
              // Basic logic to group messages: In a real app check if prev msg sender is same
              const showHeader = index === 0 || selectedChat.messages[index - 1].senderId !== msg.senderId;

              return (
                <div
                  key={msg.id}
                  className={`group flex gap-3 px-2 py-1 hover:bg-slate-100/50 dark:hover:bg-white/5 -mx-2 rounded-lg transition-colors ${showHeader ? "mt-4" : "mt-0"}`}
                >
                  {/* Avatar Column */}
                  <div className="w-10 flex-shrink-0">
                    {showHeader &&
                      (isMe ? (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-500">
                          You
                        </div>
                      ) : (
                        <div className="relative w-9 h-9 rounded-full overflow-hidden">
                          <Image src={selectedChat.user.avatar} alt="" fill sizes="36px" className="object-cover" />
                        </div>
                      ))}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    {showHeader && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{isMe ? "You" : selectedChat.user.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                      </div>
                    )}
                    <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-white/5 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <Paperclip size={20} />
              </button>
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none max-h-32 py-2"
                rows={1}
              />
              <div className="flex gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                  <Smile size={20} />
                </button>
                <button className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State (Tablet/Desktop) */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Send size={32} />
          </div>
          <p className="font-medium">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default ChatView;
