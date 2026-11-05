import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageCircleHeart,
  Trash2,
  Download,
  Camera,
  X,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { romanticAudio } from '../utils/audioSynth';
import { compressImageFile, idbGet, idbSet } from '../utils/persistentStorage';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface AnikAIChatSectionProps {
  girlfriendName: string;
  boyfriendName: string;
  userEmail: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const IDB_ANIK_AVATAR_KEY = 'amore_anik_profile_pic_permanent_v1';
const IDB_DIDI_AVATAR_KEY = 'amore_didi_profile_pic_permanent_v1';

const DEFAULT_ANIK_AVATAR = '/assets/aistudio/IMG_20260327_162545_57902134.jpg';

const STARTER_PROMPTS_FOR_DIDI = [
  'Oii! Kemon achis? Ki korchis ekhon?',
  'Explain Neural Networks in simple words!',
  'Give me quick tips for my Bangalore internship!',
  'Suggest a great movie to watch tonight 🎬',
  'Write a short Python snippet for data analysis!',
];

const STARTER_PROMPTS_FOR_ANIK = [
  'Hey Didi! Kemon achis? Tor exam ar Bangalore intern er ki khobor?',
  'Suggest a cool school exhibition project idea with pros & cons!',
  'Spider-Man ba Odyssey dekhli? Dune 3 kobe dekhbi bol!',
  'Kali pujoi misti ar treat kobe khawabi bol!',
  'Explain a cool Data Science & Business Analytics concept!',
];

export const AnikAIChatSection: React.FC<AnikAIChatSectionProps> = ({
  girlfriendName,
  boyfriendName,
  userEmail,
}) => {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  // When arpitaghosh2167@gmail.com is logged in -> User is Anik, AI Responder is Didi (Atrayee)
  // When atrayeede0025@gmail.com is logged in -> User is Didi (Atrayee), AI Responder is Anik
  const isAnikLoggedIn = normalizedEmail === 'arpitaghosh2167@gmail.com';
  const responderPersona: 'didi' | 'anik' = isAnikLoggedIn ? 'didi' : 'anik';

  const chatPartnerName = isAnikLoggedIn
    ? `${girlfriendName} (Didi)`
    : `${boyfriendName} (Little Bro)`;
  const chatPartnerShortName = isAnikLoggedIn ? girlfriendName : boyfriendName;
  const currentUserDisplayName = isAnikLoggedIn
    ? boyfriendName
    : `${girlfriendName} (Didi)`;

  const storageHistoryKey = isAnikLoggedIn
    ? 'amore_chat_history_as_anik_v2'
    : 'amore_chat_history_as_didi_v2';

  const getWelcomeMessage = (anikMode: boolean): ChatMessage => {
    if (anikMode) {
      return {
        id: 'welcome-msg-didi',
        role: 'model',
        text: `Oii ${boyfriendName}! ❤️ Thik achi re, tor 9th er porashona ar AI project kemon cholche bol? Kali pujoi pakka treat khawabo! Ki jigges korbi bol!`,
        timestamp: 'Online',
      };
    }
    return {
      id: 'welcome-msg-anik',
      role: 'model',
      text: `Hey ${girlfriendName} Didi! ❤️ Happy 28th May! Kemon achis bol? Ekta call o to koris na! Tui amake jekono question korte paris — tech, Data Science, movies, ba amader golpo — ami ekhane tor sathe achi!`,
      timestamp: 'Online',
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getWelcomeMessage(isAnikLoggedIn),
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile pictures for both Anik and Didi (stored permanently in IndexedDB & localStorage)
  const [anikAvatar, setAnikAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(IDB_ANIK_AVATAR_KEY);
      if (saved !== null) return saved;
    } catch {}
    return DEFAULT_ANIK_AVATAR;
  });

  const [didiAvatar, setDidiAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(IDB_DIDI_AVATAR_KEY);
      if (saved !== null) return saved;
    } catch {}
    return '';
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const myProfileFileRef = useRef<HTMLInputElement | null>(null);

  // Restore saved chat messages for the active account and both profile pictures from IndexedDB
  useEffect(() => {
    let mounted = true;
    async function restoreChatState() {
      const [savedMsgs, savedAnikPic, savedDidiPic] = await Promise.all([
        idbGet<ChatMessage[]>(storageHistoryKey),
        idbGet<string>(IDB_ANIK_AVATAR_KEY),
        idbGet<string>(IDB_DIDI_AVATAR_KEY),
      ]);
      if (!mounted) return;
      if (Array.isArray(savedMsgs) && savedMsgs.length > 0) {
        setMessages(savedMsgs);
      } else {
        setMessages([getWelcomeMessage(isAnikLoggedIn)]);
      }
      if (savedAnikPic !== undefined) {
        setAnikAvatar(savedAnikPic);
      }
      if (savedDidiPic !== undefined) {
        setDidiAvatar(savedDidiPic);
      }
    }
    void restoreChatState();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnikLoggedIn, storageHistoryKey]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Save every chat exchange to the permanent Firestore database (/chatLogs/{logId})
  // where Atrayee can write on send, but cannot read, modify, or delete
  const saveChatToPermanentDatabase = async (
    userText: string,
    replyText: string
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return;

    const logId = `chat_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const path = `chatLogs/${logId}`;

    try {
      await setDoc(doc(collection(db, 'chatLogs'), logId), {
        authorUid: currentUser.uid,
        authorEmail: currentUser.email,
        userMessage: userText.slice(0, 2000),
        anikReply: replyText.slice(0, 4000),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isLoading) return;

    romanticAudio.playSoftClick();
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: nowTime,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    void idbSet(storageHistoryKey, updatedMessages);
    if (!promptText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/anik-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          responderPersona,
          history: updatedMessages.slice(-10).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      const defaultReply = isAnikLoggedIn
        ? 'Oii Anik! Network ta ektu slow chilo, arekbar bol! ❤️'
        : 'Hey Didi! Network ta ektu slow chilo, arekbar bol! ❤️';
      const replyText = data?.reply || defaultReply;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      void idbSet(storageHistoryKey, finalMessages);
      romanticAudio.playCelebrationChime();

      // Permanently store in Firestore /chatLogs (inaccessible to Didi)
      void saveChatToPermanentDatabase(textToSend, replyText);
    } catch {
      const fallbackReply = isAnikLoggedIn
        ? `Oii ${boyfriendName}! Ekhon ektu exam ar intern er kaaje busy achi, pore bolchi! ✨`
        : `Hey Didi! Ami ekhon ektu busy achi, kintu tor message peyechi! Arekbar send kor! ✨`;
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: fallbackReply,
        timestamp: nowTime,
      };
      const finalMessages = [...updatedMessages, fallbackMsg];
      setMessages(finalMessages);
      void idbSet(storageHistoryKey, finalMessages);
      void saveChatToPermanentDatabase(textToSend, fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Strictly only allow uploading/removing the currently logged-in user's own profile photo
  const handleUploadMyOwnAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 500, 0.85);
      if (isAnikLoggedIn) {
        // Logged in as arpitaghosh2167@gmail.com -> Only Anik's photo can be updated
        setAnikAvatar(compressed);
        void idbSet(IDB_ANIK_AVATAR_KEY, compressed);
        try {
          localStorage.setItem(IDB_ANIK_AVATAR_KEY, compressed);
        } catch {}
      } else {
        // Logged in as atrayeede0025@gmail.com -> Only Didi's photo can be updated
        setDidiAvatar(compressed);
        void idbSet(IDB_DIDI_AVATAR_KEY, compressed);
        try {
          localStorage.setItem(IDB_DIDI_AVATAR_KEY, compressed);
        } catch {}
      }
      romanticAudio.playCelebrationChime();
    } catch (err) {
      console.error('Failed to upload profile picture', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveMyOwnAvatar = () => {
    romanticAudio.playSoftClick();
    if (isAnikLoggedIn) {
      setAnikAvatar('');
      void idbSet(IDB_ANIK_AVATAR_KEY, '');
      try {
        localStorage.setItem(IDB_ANIK_AVATAR_KEY, '');
      } catch {}
    } else {
      setDidiAvatar('');
      void idbSet(IDB_DIDI_AVATAR_KEY, '');
      try {
        localStorage.setItem(IDB_DIDI_AVATAR_KEY, '');
      } catch {}
    }
  };

  // Export current chat history as a clean .txt file
  const handleExportChat = () => {
    romanticAudio.playSoftClick();
    const lines = messages.map((m) => {
      const sender =
        m.role === 'user' ? currentUserDisplayName : chatPartnerName;
      return `[${m.timestamp}] ${sender}: ${m.text}`;
    });
    const content = `Chat History between ${girlfriendName} (Didi) & ${boyfriendName}\nExported on ${new Date().toLocaleString()}\n------------------------------------------------------------\n\n${lines.join(
      '\n\n'
    )}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chat_${boyfriendName}_${girlfriendName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear local visible chat history (permanent database records in Firestore remain intact)
  const handleClearChat = () => {
    const resetMsg: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: isAnikLoggedIn
          ? `Oii ${boyfriendName}! ❤️ Chat fresh kore dilam — bol ki jigges korbi!`
          : `Hey ${girlfriendName} Didi! ❤️ Chat fresh kore dilam — bol ki jigges korbi!`,
        timestamp: 'Online',
      },
    ];
    setMessages(resetMsg);
    void idbSet(storageHistoryKey, resetMsg);
    romanticAudio.playSoftClick();
  };

  // Partner avatar (shown in the top header and on incoming model messages)
  const partnerAvatar = isAnikLoggedIn ? didiAvatar : anikAvatar;
  // Current logged-in user's own avatar (shown on outgoing user messages and editable by current user)
  const myOwnAvatar = isAnikLoggedIn ? anikAvatar : didiAvatar;
  const myOwnName = isAnikLoggedIn ? boyfriendName : girlfriendName;
  const activeStarterPrompts = isAnikLoggedIn
    ? STARTER_PROMPTS_FOR_ANIK
    : STARTER_PROMPTS_FOR_DIDI;

  return (
    <section
      id="anik-ai-chat"
      className="py-16 border-b border-stone-200/80 bg-[#f6f2ee]"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header — Full-Width Balanced Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <span>Chapter 07</span>
              <span aria-hidden="true">·</span>
              <span>Direct Sibling Chat & Profile Lounge</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Chat with {chatPartnerName}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-stone-600 font-sans max-w-2xl">
              {isAnikLoggedIn
                ? `Chat directly with ${girlfriendName} Didi about NIT, Bangalore, movies, exhibition ideas, or anything on your mind!`
                : `Ask ${boyfriendName} anything — tech, Data Science, movies, career tips, or casual sibling chat!`}
            </p>
          </div>

          {/* Live Connection Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-stone-200/90 shadow-xs shrink-0 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-stone-700">
              Logged in as <strong className="text-stone-900">{currentUserDisplayName}</strong>
            </span>
          </div>
        </div>

        {/* Balanced 12-Column Desktop Layout: Left Chat Window (7 cols) + Right Sibling Profile & Controls (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT COLUMN (7 Cols): 3D Keepsake Chat Window */}
          <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between card-3d-tilt">
            {/* Top Chat Header Bar */}
            <div className="bg-stone-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  {partnerAvatar ? (
                    <img
                      src={partnerAvatar}
                      alt={chatPartnerShortName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-serif font-bold text-lg border-2 border-emerald-400 shadow-md">
                      {chatPartnerShortName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-stone-900 animate-pulse" />
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                    {chatPartnerName}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {isAnikLoggedIn
                      ? `Online · Always here for ${boyfriendName} ❤️`
                      : `Online · Always here for ${girlfriendName} Didi ❤️`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-[11px] font-mono text-emerald-300">
                  {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
                </span>
              </div>
            </div>

            {/* Starter Prompt Suggestions */}
            <div className="px-4 py-2.5 bg-stone-100/80 border-b border-stone-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 shrink-0 flex items-center gap-1">
                <MessageCircleHeart className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                Quick ask:
              </span>
              {activeStarterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-rose-50 border border-stone-200/90 hover:border-rose-300 text-xs text-stone-700 hover:text-rose-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={chatContainerRef}
              className="h-[430px] overflow-y-auto p-5 space-y-4 bg-[#efeae2]/60 flex-1"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="shrink-0">
                        {partnerAvatar ? (
                          <img
                            src={partnerAvatar}
                            alt={chatPartnerShortName}
                            className="w-8 h-8 rounded-full object-cover border border-emerald-500/60 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-serif font-bold text-xs flex items-center justify-center shadow-2xs">
                            {chatPartnerShortName.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                        isUser
                          ? 'bg-rose-800 text-white rounded-br-xs'
                          : 'bg-white border border-stone-200/90 text-stone-900 rounded-bl-xs'
                      }`}
                    >
                      <div className="text-[11px] font-semibold mb-1 flex items-center justify-between gap-4 opacity-75">
                        <span>
                          {isUser ? currentUserDisplayName : chatPartnerShortName}
                        </span>
                        <span className="font-mono text-[10px]">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.text}
                      </div>
                    </div>

                    {isUser && (
                      <div className="shrink-0">
                        {myOwnAvatar ? (
                          <img
                            src={myOwnAvatar}
                            alt={myOwnName}
                            className="w-8 h-8 rounded-full object-cover border border-rose-400 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-rose-700 text-white font-serif font-bold text-xs flex items-center justify-center shadow-2xs">
                            {myOwnName.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2.5">
                  {partnerAvatar ? (
                    <img
                      src={partnerAvatar}
                      alt={chatPartnerShortName}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/60"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-serif font-bold text-xs flex items-center justify-center">
                      {chatPartnerShortName.charAt(0)}
                    </div>
                  )}
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-xs text-xs text-stone-600 animate-pulse">
                    <span>{chatPartnerShortName} is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Write a message to ${chatPartnerShortName}...`}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer btn-3d-dark shrink-0"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN (5 Cols): Sibling Profile Information, Photo Studio & Chat Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            {/* Card 1: Sibling Partner Profile Dossier */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-md card-3d-tilt">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  {partnerAvatar ? (
                    <img
                      src={partnerAvatar}
                      alt={chatPartnerShortName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-serif font-bold text-2xl border-2 border-emerald-400 shadow-sm">
                      {chatPartnerShortName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    Active Sibling Persona
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-900 mt-1 truncate">
                    {chatPartnerName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {isAnikLoggedIn
                      ? 'NIT Durgapur · Bangalore Internship · Beloved Older Sister'
                      : 'Class 9 · AI, Coding & Data Science Enthusiast · Little Brother'}
                  </p>
                </div>
              </div>

              {/* Sibling Profile Highlights & Interactive Conversation Starters */}
              <div className="mt-4 pt-4 border-t border-stone-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
                  Tap a Sibling Topic to Ask {chatPartnerShortName}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeStarterPrompts.slice(0, 4).map((topicPrompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => void handleSendMessage(topicPrompt)}
                      disabled={isLoading}
                      className="text-left p-2.5 rounded-xl bg-stone-50 hover:bg-rose-50/80 border border-stone-200/90 hover:border-rose-300 transition-all cursor-pointer group"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 group-hover:text-rose-800">
                        Topic 0{i + 1}
                      </div>
                      <div className="text-xs text-stone-700 font-medium line-clamp-2 mt-0.5">
                        {topicPrompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Role-Locked Sibling Profile Photo Studio */}
            <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-2xl p-5 shadow-md card-3d-tilt">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Sibling Avatar Studio
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-[10px] font-mono text-emerald-300 border border-stone-700">
                  Role-Locked
                </span>
              </div>

              {/* Dual Avatar Comparison Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800 flex items-center gap-2.5">
                  {myOwnAvatar ? (
                    <img
                      src={myOwnAvatar}
                      alt={myOwnName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-rose-400 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-700 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {myOwnName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold">
                      You (Editable)
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {myOwnName}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800 flex items-center gap-2.5">
                  {partnerAvatar ? (
                    <img
                      src={partnerAvatar}
                      alt={chatPartnerShortName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {chatPartnerShortName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
                      Sibling
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {chatPartnerShortName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => myProfileFileRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload My Photo ({myOwnName})</span>
                </button>

                {myOwnAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveMyOwnAvatar}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-stone-800 hover:bg-rose-950 text-rose-300 border border-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                    title={`Remove ${myOwnName}'s Profile Picture`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}

                <input
                  ref={myProfileFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadMyOwnAvatar}
                  className="hidden"
                />
              </div>
            </div>

            {/* Card 3: Chat Session Actions (Export & Clear) */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs card-3d-tilt">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Keepsake Transcript & History
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Synced
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportChat}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white transition-colors cursor-pointer btn-3d-dark"
                  title="Export Chat History (.txt)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Chat (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-800 transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Local Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
