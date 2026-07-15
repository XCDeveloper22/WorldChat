import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, LogOut, MessageCircle, Users, Globe2, Loader2, Mail } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { cn } from "./utils";
import type { User, Message } from "./types";
import { getAccessToken, googleSignIn } from "./auth";

export default function Chat() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "users">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }
    
    setUser(JSON.parse(userData));
    
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("init_messages", (initialMessages: Message[]) => {
      setMessages(initialMessages);
      scrollToBottom();
    });

    newSocket.on("new_message", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket) return;
    
    socket.emit("send_message", {
      text: inputValue.trim(),
      token: localStorage.getItem("auth_token")
    });
    
    setInputValue("");
  };

  const handleEmailTranscript = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to email this chat transcript to your Gmail account?`
    );
    if (!confirmed) return;

    setIsEmailing(true);
    let accessToken = await getAccessToken();
    
    if (!accessToken) {
       try {
           const result = await googleSignIn();
           if (result) accessToken = result.accessToken;
       } catch (err) {
           alert("Could not authenticate with Google.");
           setIsEmailing(false);
           return;
       }
    }

    if (!accessToken) {
       setIsEmailing(false);
       return;
    }

    const emailBody = messages.length === 0 
      ? "The chat is currently empty."
      : messages.map(m => `[${format(m.timestamp, "h:mm a")}] ${m.user?.name || 'Unknown'}: ${m.text}`).join('\n\n');
      
    // Create RFC 2822 formatted email
    const rawMessage = btoa(
      `To: ${user?.email}\r\n` +
      `Subject: World Chat Transcript\r\n\r\n` +
      `Here is your World Chat transcript:\n\n${emailBody}`
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawMessage })
      });
      if (!res.ok) throw new Error("Failed to send");
      alert('Transcript emailed successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to send email. Please check your permissions.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      navigate("/login");
    }, 1500); // 1.5s loading animation
  };

  if (!user) return null;

  // Derive unique users for the sidebar (simple active simulation)
  const uniqueUsers = Array.from(new Set(messages.map(m => m.user?.id)))
    .map(id => messages.find(m => m.user?.id === id)?.user)
    .filter(Boolean) as User[];
  
  if (!uniqueUsers.find(u => u.id === user.id)) {
    uniqueUsers.push(user);
  }

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm font-medium tracking-wide text-zinc-400">Signing out...</p>
          </div>
        </motion.div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex w-72 flex-col shrink-0 border-r border-zinc-900 bg-zinc-950">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <Globe2 className="text-zinc-400" size={20} />
            <span className="font-semibold tracking-wide text-white">WORLD CHAT</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3 px-2">Online ({uniqueUsers.length})</h3>
            <div className="space-y-1">
              {uniqueUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-900 transition-colors">
                  <div className="relative">
                    <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full bg-zinc-800" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-green-500"></span>
                  </div>
                  <span className="text-sm font-medium text-zinc-300 truncate">{u.name} {u.id === user.id && "(You)"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 shrink-0 border-t border-zinc-900 space-y-2">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full bg-zinc-800" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user.name}</span>
              <span className="text-xs text-zinc-500 truncate w-32">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleEmailTranscript}
            disabled={isEmailing}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors disabled:opacity-50"
          >
            {isEmailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} 
            {isEmailing ? "Sending..." : "Email Transcript"}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-screen min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex h-14 shrink-0 items-center justify-center border-b border-zinc-900 bg-zinc-950 px-4">
          <span className="text-sm font-semibold tracking-wider text-white">WORLD CHAT</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          {activeTab === "chat" ? (
            <div className="flex flex-col justify-end min-h-full space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4 opacity-50 py-20">
                  <MessageCircle size={48} strokeWidth={1} />
                  <p className="text-sm">It's quiet here. Say hello to the world.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.userId === user.id;
                  const showHeader = i === 0 || messages[i-1].userId !== msg.userId || msg.timestamp - messages[i-1].timestamp > 5 * 60 * 1000;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={msg.id}
                      className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
                    >
                      {showHeader && !isMine && msg.user && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <img src={msg.user.avatar} className="h-5 w-5 rounded-full bg-zinc-800" alt="" />
                          <span className="text-xs font-medium text-zinc-400">{msg.user.name}</span>
                          <span className="text-[10px] text-zinc-600">{format(msg.timestamp, "h:mm a")}</span>
                        </div>
                      )}
                      {showHeader && isMine && (
                        <div className="flex items-center gap-2 mb-1 mr-1">
                          <span className="text-[10px] text-zinc-600">{format(msg.timestamp, "h:mm a")}</span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[70%] text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap",
                          isMine 
                            ? "bg-zinc-100 text-zinc-950 rounded-br-sm" 
                            : "bg-zinc-900 border border-zinc-800/50 text-zinc-100 rounded-bl-sm"
                        )}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            // Mobile Users Tab
            <div className="max-w-md mx-auto space-y-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3 px-2">Online ({uniqueUsers.length})</h3>
              <div className="space-y-2">
                {uniqueUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-zinc-900 p-3 bg-zinc-950/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full bg-zinc-800" />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 bg-green-500"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-300">{u.name} {u.id === user.id && "(You)"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-8">
                <button
                  onClick={handleEmailTranscript}
                  disabled={isEmailing}
                  className="flex w-full justify-center items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isEmailing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} 
                  {isEmailing ? "Sending..." : "Email Transcript"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full justify-center items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Desktop & Mobile Chat Tab) */}
        {activeTab === "chat" && (
          <div className="shrink-0 border-t border-zinc-900 bg-zinc-950 p-4 pb-safe">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-full bg-zinc-900 border border-zinc-800 py-3.5 pl-5 pr-14 text-[15px] text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden shrink-0 h-16 border-t border-zinc-900 bg-zinc-950 flex items-center justify-around px-2 pb-safe">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors",
              activeTab === "chat" ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            <MessageCircle size={20} className={activeTab === "chat" ? "fill-zinc-100" : ""} />
            <span className="text-[10px] font-medium tracking-wide">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors",
              activeTab === "users" ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-400"
            )}
          >
            <Users size={20} className={activeTab === "users" ? "fill-zinc-100" : ""} />
            <span className="text-[10px] font-medium tracking-wide">Online</span>
          </button>
        </div>
      </div>
    </div>
  );
}
