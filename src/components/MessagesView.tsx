import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, MessageSquare, Bot, ArrowLeft } from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';

interface MessagesViewProps {
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export default function MessagesView({
  chatSessions,
  setChatSessions,
  showToast
}: MessagesViewProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId || !activeSession) return;

    const userMsgText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      senderName: 'Alex',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session locally with user message
    let updatedSession: ChatSession | null = null;
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const updated = { ...s, messages: [...s.messages, newMsg] };
          updatedSession = updated;
          return updated;
        }
        return s;
      })
    );

    // Call server API for generative Response using Gemini
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedSession ? (updatedSession as ChatSession).messages : [...activeSession.messages, newMsg],
          recipient: activeSession.name,
          recipientRole: activeSession.role || 'Teammate',
        }),
      });

      if (!response.ok) {
        throw new Error('Network response failed');
      }

      const data = await response.json();
      const aiReplyText = data.text || 'Understood! Talk to you soon.';

      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'agent',
        senderName: activeSession.name,
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Append generative reply
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, agentMsg], unread: false };
          }
          return s;
        })
      );
    } catch (err) {
      console.error('Failed to retrieve chat response:', err);
      // Fallback response block
      const fallbackReply: ChatMessage = {
        id: Math.random().toString(),
        sender: 'agent',
        senderName: activeSession.name,
        text: `Hey Alex! I received your text message, but some connectivity systems are down. Yes, let's keep in touch!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, fallbackReply], unread: false };
          }
          return s;
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-172px)] flex flex-col bg-[#f7f9fb] animate-[slideUp_0.3s_ease]">
      
      {/* 1. MASTER SPLIT VIEW: CHANNEL/DM BOARD LIST */}
      {!activeSessionId ? (
        <div className="flex-1 overflow-y-auto space-y-md">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-secondary">Messaging Workspace</h2>
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
              <Bot size={13} /> Live AI Teammates
            </span>
          </div>

          {/* Group: Public Broadcast Channels */}
          <div className="space-y-sm">
            <h3 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest pl-2">Public Channels</h3>
            <div className="bg-surface-container-lowest rounded-xl divide-y divide-outline-variant/30 border border-outline-variant/10 shadow-sm overflow-hidden">
              {chatSessions.filter(s => s.isChannel).map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    // Mark read
                    setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, unread: false } : s));
                  }}
                  className="w-full p-md text-left flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full bg-primary-container/10 text-primary flex items-center justify-center shrink-0">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary flex items-center gap-1.5 leading-none">
                        {session.name}
                        {session.unread && <span className="h-2 w-2 rounded-full bg-error" />}
                      </p>
                      <p className="text-xs text-on-surface-variant/70 mt-1 lines-clamp-1">
                        {session.messages.length > 0 
                          ? session.messages[session.messages.length - 1].text 
                          : 'No announcements posted yet'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-semibold font-mono pr-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group: Private Direct messages */}
          <div className="space-y-sm">
            <h3 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest pl-2 font-headline-sm">Direct Messages</h3>
            <div className="bg-surface-container-lowest rounded-xl divide-y divide-outline-variant/30 border border-outline-variant/10 shadow-sm overflow-hidden">
              {chatSessions.filter(s => !s.isChannel).map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, unread: false } : s));
                  }}
                  className="w-full p-md text-left flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-outline-variant/10 bg-secondary-container">
                      <img 
                        alt={session.name} 
                        className="w-full h-full object-cover" 
                        src={session.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuC1pdgsUgDQhMYjJrzll_Hluh_RltuhYNzkbFQ-a2OeVdq1xqT8EH_cICJJ9pKNFEmiHGLdyagN_NllbDRBi7tiY1pcDUj7FKAXVL-h_6mmA_c7McSMlL8hrK2MPpPtNjuyrc8as5tdyyTD5s1Ny8G_wL_7uiIDcgUWedFg00kkd_Es3jdLji89wIQAimO806Yhe9djbS0MZFuwiU_05QSAEyCtmgi41YbVpnRuasjwQ9vzBzlSWa20S_n28Ts-VDvN32GFjqY9dH-5"} 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary flex items-center gap-1.5 leading-none">
                        {session.name}
                        {session.unread && <span className="h-2 w-2 rounded-full bg-error animate-pulse" />}
                      </p>
                      <p className="text-xs text-on-surface-variant/55 mt-1 font-medium">{session.role}</p>
                      <p className="text-[11px] text-on-surface-variant/80 mt-1 lines-clamp-1 italic">
                        {session.messages.length > 0 
                          ? `"${session.messages[session.messages.length - 1].text}"` 
                          : 'Start a conversation...'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-semibold font-mono pr-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        
        // 2. ACTIVE CHAT WORKSPACE DIALOGUE SCREEN
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border border-outline-variant/15 overflow-hidden">
          
          {/* Chat Window header */}
          <div className="bg-surface-container-low p-md border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <button 
                onClick={() => setActiveSessionId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-secondary active:scale-[0.87]"
              >
                <ArrowLeft size={18} />
              </button>
              
              <div className="flex items-center gap-sm">
                {!activeSession.isChannel ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary-container">
                    <img 
                      alt="" 
                      className="w-full h-full object-cover" 
                      src={activeSession.avatar} 
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={16} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-secondary">{activeSession.name}</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                    {activeSession.isChannel ? 'Public Channel' : activeSession.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages viewport body */}
          <div className="flex-1 overflow-y-auto p-md space-y-sm bg-[#f7f9fb] hide-scrollbar">
            {activeSession.messages.length > 0 ? (
              activeSession.messages.map((msg) => {
                const isMe = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[9px] font-mono font-bold text-on-surface-variant mb-0.5 ml-1">
                        {msg.senderName}
                      </span>
                    )}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-surface-container-lowest text-secondary rounded-tl-none border border-outline-variant/10 shadow-xs'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/50 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-md text-xs text-on-surface-variant italic pt-12">
                No past chat record found. Type to start a live conversation with {activeSession.name}.
              </div>
            )}

            {/* Typing visual status feed */}
            {isTyping && (
              <div className="flex flex-col mr-auto max-w-[85%] items-start animate-pulse">
                <span className="text-[9px] font-mono font-bold text-on-surface-variant mb-0.5 ml-1">
                  {activeSession.name}
                </span>
                <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-outline-variant/10 text-xs text-on-surface-variant flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed-dim inline-block animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed-dim inline-block animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed-dim inline-block animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Submission Input Row */}
          <form onSubmit={handleSendMessage} className="p-sm bg-white border-t border-outline-variant/20 flex gap-xs items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeSession.name}...`}
              className="flex-1 bg-[#f7f9fb] text-xs p-3 border border-outline-variant/20 rounded-xl focus:outline-primary placeholder-on-surface-variant/40 outline-none focus:bg-white text-secondary font-medium"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 disabled:bg-[#f2f4f6] disabled:text-on-surface-variant/30 active:scale-95 transition-transform cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
export type { MessagesViewProps };
