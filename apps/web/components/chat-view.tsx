'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Video,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic,
  SendHorizontal,
  Download,
  CheckCheck,
  Check,
  FileText,
  CornerUpRight,
  X,
  PhoneOff,
  Maximize2,
} from 'lucide-react';
import { MobileShell } from '@/components/mobile-shell';

interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  time: string;
  type: 'pdf' | 'doc-preview' | 'architecture-diagram' | 'text';
  text?: string;
  pdfData?: {
    fileName: string;
    pages: number;
    size: string;
  };
  docData?: {
    header: string;
    subPdf: {
      fileName: string;
      pages: number;
      size: string;
    };
  };
  isForwarded?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'me',
    time: '10:31 AM',
    type: 'pdf',
    isForwarded: true,
    pdfData: {
      fileName: 'Smart_Vision_Surveillance_RN_Format.pdf',
      pages: 3,
      size: '128 kB',
    },
  },
  {
    id: 'msg-2',
    sender: 'me',
    time: '10:31 AM',
    type: 'doc-preview',
    isForwarded: true,
    docData: {
      header: 'AUTOMATED SMART SURVEILLANCE',
      subPdf: {
        fileName: 'Docs.pdf',
        pages: 1,
        size: '44 kB',
      },
    },
  },
  {
    id: 'msg-3',
    sender: 'me',
    time: '3:42 PM',
    type: 'architecture-diagram',
  },
  {
    id: 'msg-4',
    sender: 'other',
    time: '3:44 PM',
    type: 'text',
    text: "Please check the surveillance block diagram. Does this cover the initial specifications for Tuesday's lab submission?",
  },
  {
    id: 'msg-5',
    sender: 'me',
    time: '3:45 PM',
    type: 'text',
    text: 'Yes, perfect! I will review the API contracts tonight and share the test results. 👍',
  },
];

interface ChatContact {
  userId: string;
  name: string;
  avatar?: string;
  avatarChar?: string;
  avatarBg?: string;
  status: string;
  isOnline: boolean;
}

const CONTACTS: Record<string, ChatContact> = {
  'mohan-vit': {
    userId: 'user_mohan',
    name: 'Mohan Vit',
    avatarChar: 'MV',
    avatarBg: 'from-[#3b82f6] via-[#4f46e5] to-[#7c3aed]',
    status: 'Active now',
    isOnline: true,
  },
  user_mohan: {
    userId: 'user_mohan',
    name: 'Mohan Vit',
    avatarChar: 'MV',
    avatarBg: 'from-[#3b82f6] via-[#4f46e5] to-[#7c3aed]',
    status: 'Active now',
    isOnline: true,
  },
  daniel: {
    userId: 'user_daniel',
    name: 'Daniel',
    avatar: '/images/avatars/avatar-daniel.jpg',
    avatarChar: 'D',
    avatarBg: 'from-[#10b981] to-[#047857]',
    status: 'Active now',
    isOnline: true,
  },
  user_daniel: {
    userId: 'user_daniel',
    name: 'Daniel',
    avatar: '/images/avatars/avatar-daniel.jpg',
    avatarChar: 'D',
    avatarBg: 'from-[#10b981] to-[#047857]',
    status: 'Active now',
    isOnline: true,
  },
  nixtio: {
    userId: 'user_nixtio',
    name: 'Nixtio',
    avatarChar: 'N',
    avatarBg: 'from-[#1e293b] to-[#0f172a]',
    status: 'Active now',
    isOnline: true,
  },
  user_nixtio: {
    userId: 'user_nixtio',
    name: 'Nixtio',
    avatarChar: 'N',
    avatarBg: 'from-[#1e293b] to-[#0f172a]',
    status: 'Active now',
    isOnline: true,
  },
  anna: {
    userId: 'user_anna',
    name: 'Anna',
    avatar: '/images/avatars/avatar-anna.jpg',
    avatarChar: 'A',
    avatarBg: 'from-[#ec4899] to-[#be185d]',
    status: 'Active now',
    isOnline: true,
  },
  user_anna: {
    userId: 'user_anna',
    name: 'Anna',
    avatar: '/images/avatars/avatar-anna.jpg',
    avatarChar: 'A',
    avatarBg: 'from-[#ec4899] to-[#be185d]',
    status: 'Active now',
    isOnline: true,
  },
  nathan: {
    userId: 'user_nathan',
    name: 'Nathan',
    avatar: '/images/avatars/avatar-marcus.jpg',
    avatarChar: 'NV',
    avatarBg: 'from-[#f59e0b] to-[#d97706]',
    status: 'Active now',
    isOnline: true,
  },
  user_nathan: {
    userId: 'user_nathan',
    name: 'Nathan',
    avatar: '/images/avatars/avatar-marcus.jpg',
    avatarChar: 'NV',
    avatarBg: 'from-[#f59e0b] to-[#d97706]',
    status: 'Active now',
    isOnline: true,
  },
  elena: {
    userId: 'user_elena',
    name: 'Elena',
    avatar: '/images/avatars/avatar-elena.jpg',
    avatarChar: 'E',
    avatarBg: 'from-[#8b5cf6] to-[#6d28d9]',
    status: 'Active 12m ago',
    isOnline: false,
  },
  user_elena: {
    userId: 'user_elena',
    name: 'Elena',
    avatar: '/images/avatars/avatar-elena.jpg',
    avatarChar: 'E',
    avatarBg: 'from-[#8b5cf6] to-[#6d28d9]',
    status: 'Active 12m ago',
    isOnline: false,
  },
};

const CHAT_CONVERSATIONS: Record<string, ChatMessage[]> = {
  'mohan-vit': INITIAL_MESSAGES,
  user_mohan: INITIAL_MESSAGES,
  daniel: [
    {
      id: 'msg-d1',
      sender: 'other',
      time: '11:15 AM',
      type: 'text',
      text: 'Hey! Just finished uploading the mobile app design system and component mocks to Figma.',
    },
    {
      id: 'msg-d2',
      sender: 'me',
      time: '11:18 AM',
      type: 'text',
      text: 'Looks super clean! Are the color tokens and typography scale ready for code inspection?',
    },
    {
      id: 'msg-d3',
      sender: 'other',
      time: '11:20 AM',
      type: 'text',
      text: 'Yes, exactly! Sent a project mock screenshot of the dashboard and checkout flow.',
    },
    {
      id: 'msg-d4',
      sender: 'me',
      time: '11:22 AM',
      type: 'text',
      text: 'Got it, I will start building the components in React and verify the responsive layout today! 🚀',
    },
  ],
  user_daniel: [
    {
      id: 'msg-d1',
      sender: 'other',
      time: '11:15 AM',
      type: 'text',
      text: 'Hey! Just finished uploading the mobile app design system and component mocks to Figma.',
    },
    {
      id: 'msg-d2',
      sender: 'me',
      time: '11:18 AM',
      type: 'text',
      text: 'Looks super clean! Are the color tokens and typography scale ready for code inspection?',
    },
    {
      id: 'msg-d3',
      sender: 'other',
      time: '11:20 AM',
      type: 'text',
      text: 'Yes, exactly! Sent a project mock screenshot of the dashboard and checkout flow.',
    },
    {
      id: 'msg-d4',
      sender: 'me',
      time: '11:22 AM',
      type: 'text',
      text: 'Got it, I will start building the components in React and verify the responsive layout today! 🚀',
    },
  ],
  nixtio: [
    {
      id: 'msg-n1',
      sender: 'other',
      time: '2:10 PM',
      type: 'text',
      text: 'Check out the new design reel. Rendered the 3D physics animation at 60fps.',
    },
    {
      id: 'msg-n2',
      sender: 'me',
      time: '2:14 PM',
      type: 'text',
      text: 'That transition curve is so smooth! What easing function did you use?',
    },
    {
      id: 'msg-n3',
      sender: 'other',
      time: '2:16 PM',
      type: 'text',
      text: 'Spring damping at 0.82 with 340 stiffness. It gives that fluid tactile pop.',
    },
    {
      id: 'msg-n4',
      sender: 'me',
      time: '2:18 PM',
      type: 'text',
      text: 'Love it. Exporting the video assets now for the social launch feed. 🔥',
    },
  ],
  user_nixtio: [
    {
      id: 'msg-n1',
      sender: 'other',
      time: '2:10 PM',
      type: 'text',
      text: 'Check out the new design reel. Rendered the 3D physics animation at 60fps.',
    },
    {
      id: 'msg-n2',
      sender: 'me',
      time: '2:14 PM',
      type: 'text',
      text: 'That transition curve is so smooth! What easing function did you use?',
    },
    {
      id: 'msg-n3',
      sender: 'other',
      time: '2:16 PM',
      type: 'text',
      text: 'Spring damping at 0.82 with 340 stiffness. It gives that fluid tactile pop.',
    },
    {
      id: 'msg-n4',
      sender: 'me',
      time: '2:18 PM',
      type: 'text',
      text: 'Love it. Exporting the video assets now for the social launch feed. 🔥',
    },
  ],
  anna: [
    {
      id: 'msg-a1',
      sender: 'other',
      time: '9:40 AM',
      type: 'text',
      text: 'Photos from today architectural tour at the high-line pavilion.',
    },
    {
      id: 'msg-a2',
      sender: 'me',
      time: '9:45 AM',
      type: 'text',
      text: 'These geometric angles and natural lighting highlights are stunning!',
    },
    {
      id: 'msg-a3',
      sender: 'other',
      time: '9:48 AM',
      type: 'text',
      text: 'The raw limestone facade looks completely different at golden hour. Let me know which photos we should feature on the feed.',
    },
    {
      id: 'msg-a4',
      sender: 'me',
      time: '9:50 AM',
      type: 'text',
      text: 'I will curate the top 4 shots for today featured drops! ✨',
    },
  ],
  user_anna: [
    {
      id: 'msg-a1',
      sender: 'other',
      time: '9:40 AM',
      type: 'text',
      text: 'Photos from today architectural tour at the high-line pavilion.',
    },
    {
      id: 'msg-a2',
      sender: 'me',
      time: '9:45 AM',
      type: 'text',
      text: 'These geometric angles and natural lighting highlights are stunning!',
    },
    {
      id: 'msg-a3',
      sender: 'other',
      time: '9:48 AM',
      type: 'text',
      text: 'The raw limestone facade looks completely different at golden hour. Let me know which photos we should feature on the feed.',
    },
    {
      id: 'msg-a4',
      sender: 'me',
      time: '9:50 AM',
      type: 'text',
      text: 'I will curate the top 4 shots for today featured drops! ✨',
    },
  ],
  nathan: [
    {
      id: 'msg-na1',
      sender: 'other',
      time: '4:20 PM',
      type: 'text',
      text: 'Live camera demo session stream starts in 15 minutes. Ready with the 4K low-latency test?',
    },
    {
      id: 'msg-na2',
      sender: 'me',
      time: '4:22 PM',
      type: 'text',
      text: 'Audio bitrate and video encoders are calibrated. Joining the stream now!',
    },
    {
      id: 'msg-na3',
      sender: 'other',
      time: '4:25 PM',
      type: 'text',
      text: 'Great, let us test camera switching and real-time screen sharing.',
    },
    {
      id: 'msg-na4',
      sender: 'me',
      time: '4:26 PM',
      type: 'text',
      text: 'Connected! The screen preview is crystal clear. 🎥',
    },
  ],
  user_nathan: [
    {
      id: 'msg-na1',
      sender: 'other',
      time: '4:20 PM',
      type: 'text',
      text: 'Live camera demo session stream starts in 15 minutes. Ready with the 4K low-latency test?',
    },
    {
      id: 'msg-na2',
      sender: 'me',
      time: '4:22 PM',
      type: 'text',
      text: 'Audio bitrate and video encoders are calibrated. Joining the stream now!',
    },
    {
      id: 'msg-na3',
      sender: 'other',
      time: '4:25 PM',
      type: 'text',
      text: 'Great, let us test camera switching and real-time screen sharing.',
    },
    {
      id: 'msg-na4',
      sender: 'me',
      time: '4:26 PM',
      type: 'text',
      text: 'Connected! The screen preview is crystal clear. 🎥',
    },
  ],
  elena: [
    {
      id: 'msg-e1',
      sender: 'other',
      time: '1:05 PM',
      type: 'text',
      text: 'Linen texture palette exports and material swatches are ready for the apparel collection.',
    },
    {
      id: 'msg-e2',
      sender: 'me',
      time: '1:10 PM',
      type: 'text',
      text: 'The earth tone palette with sand and raw flax looks so organic and warm.',
    },
    {
      id: 'msg-e3',
      sender: 'other',
      time: '1:12 PM',
      type: 'text',
      text: 'Thanks! Sending over the high-res texture packs and color references.',
    },
    {
      id: 'msg-e4',
      sender: 'me',
      time: '1:15 PM',
      type: 'text',
      text: 'Perfect, queuing them up for the catalog! 🧶',
    },
  ],
  user_elena: [
    {
      id: 'msg-e1',
      sender: 'other',
      time: '1:05 PM',
      type: 'text',
      text: 'Linen texture palette exports and material swatches are ready for the apparel collection.',
    },
    {
      id: 'msg-e2',
      sender: 'me',
      time: '1:10 PM',
      type: 'text',
      text: 'The earth tone palette with sand and raw flax looks so organic and warm.',
    },
    {
      id: 'msg-e3',
      sender: 'other',
      time: '1:12 PM',
      type: 'text',
      text: 'Thanks! Sending over the high-res texture packs and color references.',
    },
    {
      id: 'msg-e4',
      sender: 'me',
      time: '1:15 PM',
      type: 'text',
      text: 'Perfect, queuing them up for the catalog! 🧶',
    },
  ],
};

const REPLIES_BY_CONTACT: Record<string, string> = {
  'mohan-vit': 'Noted! Looking forward to reviewing the test coverage results. Thanks for the quick update!',
  user_mohan: 'Noted! Looking forward to reviewing the test coverage results. Thanks for the quick update!',
  daniel: 'Got your message! I will adjust the token contrast and push an updated Figma build shortly. 👍',
  user_daniel: 'Got your message! I will adjust the token contrast and push an updated Figma build shortly. 👍',
  nixtio: 'Thanks! Let me know if you need any other 3D viewport angles or renders. 🚀',
  user_nixtio: 'Thanks! Let me know if you need any other 3D viewport angles or renders. 🚀',
  anna: 'Great idea! I will prepare the high-res photo gallery exports for you. 📸',
  user_anna: 'Great idea! I will prepare the high-res photo gallery exports for you. 📸',
  nathan: 'All clear! Stream latency is holding steady at under 120ms. 🎥',
  user_nathan: 'All clear! Stream latency is holding steady at under 120ms. 🎥',
  elena: 'Thank you! Glad you like the organic weave samples. 🧶',
  user_elena: 'Thank you! Glad you like the organic weave samples. 🧶',
};

export function ChatView({ chatId = 'mohan-vit' }: { chatId?: string }) {
  const router = useRouter();
  const contactKey = (chatId || 'mohan-vit').toLowerCase();
  const contact: ChatContact =
    CONTACTS[contactKey] ||
    CONTACTS['mohan-vit'];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return CHAT_CONVERSATIONS[contactKey] || CHAT_CONVERSATIONS['mohan-vit'] || INITIAL_MESSAGES;
  });
  const [inputValue, setInputValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'video' | 'audio' | null>(null);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  useEffect(() => {
    const key = (chatId || 'mohan-vit').toLowerCase();
    setMessages(CHAT_CONVERSATIONS[key] || CHAT_CONVERSATIONS['mohan-vit'] || INITIAL_MESSAGES);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      time: timeStr,
      type: 'text',
      text: inputValue.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');

    // Simulate contact-specific response
    setTimeout(() => {
      const replyText =
        REPLIES_BY_CONTACT[contactKey] ||
        `Thanks for the message! I am reviewing this now and will follow up shortly. 👍`;
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'other',
        time: timeStr,
        type: 'text',
        text: replyText,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  const handleDownloadFile = (fileName: string) => {
    showToast(`Downloading ${fileName}...`);
  };

  return (
    <MobileShell bgWhite className="p-0 overflow-hidden">
      {/* Active Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg shadow-black/25 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
        {/* Top Header Bar */}
        <header className="w-full h-14 px-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-xs z-30">
          {/* Left: Back Button + Avatar + Name */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/social')}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 active:scale-95 rounded-full transition"
              aria-label="Back to Social"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Avatar with Gradient/Image & Online Dot + Name (Linked to profile) */}
            <Link
              href={`/profile/${contact.userId || chatId}`}
              className="flex items-center gap-2 hover:opacity-90 active:scale-98 transition cursor-pointer"
              aria-label={`View ${contact.name}'s profile`}
            >
              <div className="relative">
                {contact.avatar ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${contact.avatarBg || 'from-[#3b82f6] to-[#7c3aed]'} flex items-center justify-center text-white font-bold text-sm shadow-xs tracking-tight`}
                  >
                    {contact.avatarChar || contact.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {/* Online Indicator Dot */}
                {contact.isOnline && (
                  <span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-xs" />
                )}
              </div>

              {/* Name and Status */}
              <div className="flex flex-col ml-1">
                <h1 className="font-bold text-[15px] text-slate-900 leading-tight">
                  {contact.name}
                </h1>
                <span
                  className={`text-xs font-semibold leading-tight mt-0.5 ${
                    contact.isOnline ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                >
                  {contact.status}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action Icons: Video Call, Phone Call, More Menu */}
          <div className="flex items-center gap-4 text-slate-600 pr-1">
            <button
              type="button"
              onClick={() => setShowCallModal('video')}
              className="hover:text-blue-600 active:scale-95 transition p-1"
              aria-label="Video Call"
            >
              <Video className="w-5 h-5 stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={() => setShowCallModal('audio')}
              className="hover:text-blue-600 active:scale-95 transition p-1"
              aria-label="Audio Call"
            >
              <Phone className="w-5 h-5 stroke-[1.8]" />
            </button>
            <button
              type="button"
              onClick={() => showToast('Chat details & options')}
              className="hover:text-slate-900 active:scale-95 transition p-1"
              aria-label="More Options"
            >
              <MoreVertical className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>
        </header>

        {/* Chat Feed Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 no-scrollbar bg-slate-50/60">
          {/* Centered Date Separator Pill */}
          <div className="flex justify-center my-2">
            <span className="bg-slate-200/75 text-slate-600 font-medium text-[11px] px-3.5 py-1 rounded-full shadow-xs">
              Tuesday
            </span>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  isMe ? 'justify-end' : 'justify-start'
                } group`}
              >
                {/* Left Forward/Reply Arrow for Sent Messages */}
                {isMe && (
                  <button
                    type="button"
                    onClick={() => showToast('Forward message')}
                    className="w-6 h-6 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition active:scale-95 self-center shrink-0"
                    aria-label="Forward message"
                  >
                    <CornerUpRight className="w-3.5 h-3.5 -scale-x-100" />
                  </button>
                )}

                {/* 1. PDF Attachment Message */}
                {msg.type === 'pdf' && msg.pdfData && (
                  <div className="bg-[#2563eb] text-white rounded-[20px] rounded-tr-xs p-3 max-w-[88%] sm:max-w-[310px] shadow-sm">
                    {/* Forwarded Header */}
                    {msg.isForwarded && (
                      <div className="flex items-center gap-1 text-[11px] text-blue-100 italic mb-2 font-medium">
                        <CornerUpRight className="w-3 h-3 -scale-x-100" />
                        <span>Forwarded</span>
                      </div>
                    )}

                    {/* PDF White Card */}
                    <div
                      onClick={() => handleDownloadFile(msg.pdfData!.fileName)}
                      className="bg-white rounded-xl p-2.5 flex items-center gap-2.5 text-slate-900 shadow-xs cursor-pointer hover:bg-slate-50 transition"
                    >
                      {/* Red PDF Icon Block */}
                      <div className="w-10 h-10 rounded-lg bg-[#ef4444] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-tight leading-none mb-0.5">
                          PDF
                        </span>
                        <FileText className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-900 leading-tight truncate">
                          {msg.pdfData.fileName}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                          {msg.pdfData.pages} pages • PDF • {msg.pdfData.size}
                        </span>
                      </div>

                      {/* Download Circular Icon */}
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 hover:bg-slate-200 transition">
                        <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Time & Double Checkmark */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-blue-100 font-medium mt-1.5">
                      <span>{msg.time}</span>
                      <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </div>
                )}

                {/* 2. Document Preview + Sub-PDF Attachment */}
                {msg.type === 'doc-preview' && msg.docData && (
                  <div className="bg-[#2563eb] text-white rounded-[20px] rounded-tr-xs p-3 max-w-[88%] sm:max-w-[310px] shadow-sm space-y-2.5">
                    {/* Forwarded Header */}
                    {msg.isForwarded && (
                      <div className="flex items-center gap-1 text-[11px] text-blue-100 italic font-medium">
                        <CornerUpRight className="w-3 h-3 -scale-x-100" />
                        <span>Forwarded</span>
                      </div>
                    )}

                    {/* White Document Preview Page */}
                    <div className="bg-white rounded-xl p-3 text-slate-900 shadow-xs flex flex-col justify-between h-24 border border-blue-200/40">
                      <div>
                        <span className="font-mono text-[9px] font-extrabold tracking-wider text-slate-800 text-center block uppercase">
                          {msg.docData.header}
                        </span>
                        <div className="w-full h-[2.5px] bg-blue-300 rounded mt-1.5 mb-1" />
                        <div className="w-3/4 h-[2px] bg-slate-200 rounded my-1" />
                        <div className="w-1/2 h-[2px] bg-slate-200 rounded my-1" />
                      </div>
                      <span className="text-[8px] text-slate-400 font-medium text-right">
                        Page 1/1
                      </span>
                    </div>

                    {/* Sub PDF File Card */}
                    <div
                      onClick={() => handleDownloadFile(msg.docData!.subPdf.fileName)}
                      className="bg-white rounded-xl p-2.5 flex items-center gap-2.5 text-slate-900 shadow-xs cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#ef4444] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[8px] font-black uppercase tracking-tight leading-none mb-0.5">
                          PDF
                        </span>
                        <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-900 leading-tight truncate">
                          {msg.docData.subPdf.fileName}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                          {msg.docData.subPdf.pages} page • PDF • {msg.docData.subPdf.size}
                        </span>
                      </div>
                    </div>

                    {/* Time & Double Checkmark */}
                    <div className="flex items-center justify-end gap-1 text-[10px] text-blue-100 font-medium mt-1">
                      <span>{msg.time}</span>
                      <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                  </div>
                )}

                {/* 3. Architecture Flow Diagram Card */}
                {msg.type === 'architecture-diagram' && (
                  <div
                    onClick={() => setShowDiagramModal(true)}
                    className="border-[3px] border-[#2563eb] rounded-[22px] bg-white p-3 shadow-md max-w-[92%] sm:max-w-[330px] cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                      <span className="font-mono text-[8.5px] font-bold text-slate-900 uppercase tracking-wide text-center w-full">
                        ONLINE SHOPPING SYSTEM - ARCHITECTURE FLOW
                      </span>
                      <Maximize2 className="w-3 h-3 text-slate-400 absolute top-2 right-2" />
                    </div>

                    {/* 3 Columns Top Tier */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Box 1 */}
                      <div className="border border-slate-300 rounded p-1 text-center bg-slate-50/50">
                        <span className="font-mono text-[7.5px] font-bold text-slate-800 block">
                          User Module
                        </span>
                        <span className="font-mono text-[6.5px] text-slate-500 block">
                          Auth / Profile
                        </span>
                      </div>

                      {/* Box 2 (Highlighted Active Sync) */}
                      <div className="border-2 border-blue-600 rounded p-1 text-center bg-blue-50/60 shadow-xs">
                        <span className="font-mono text-[7.5px] font-bold text-blue-700 block">
                          Catalog &amp; Search
                        </span>
                        <span className="font-mono text-[6.5px] text-blue-600 block">
                          Inventory Sync
                        </span>
                      </div>

                      {/* Box 3 */}
                      <div className="border border-slate-300 rounded p-1 text-center bg-slate-50/50">
                        <span className="font-mono text-[7.5px] font-bold text-slate-800 block">
                          Checkout &amp; Cart
                        </span>
                        <span className="font-mono text-[6.5px] text-slate-500 block">
                          Stripe Gateway
                        </span>
                      </div>
                    </div>

                    {/* Interconnecting REST / WebSocket Bridge */}
                    <div className="flex items-center justify-center my-2">
                      <div className="h-[1px] bg-slate-300 flex-1" />
                      <span className="font-mono text-[7px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mx-1">
                        REST APIs / WebSocket
                      </span>
                      <div className="h-[1px] bg-slate-300 flex-1" />
                    </div>

                    {/* Bottom Microservices & Database Tier */}
                    <div className="border border-dashed border-blue-500 rounded-lg p-2 text-center bg-blue-50/30">
                      <span className="font-mono text-[7.5px] text-blue-900 font-semibold leading-tight block">
                        Central Database &amp; Distributed Microservices Layer
                      </span>
                    </div>

                    {/* Dark Timestamp Overlay Pill at Bottom-Right */}
                    <div className="flex justify-end mt-2">
                      <div className="bg-slate-900/70 text-white text-[9px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <span>{msg.time}</span>
                        <CheckCheck className="w-3.5 h-3.5 stroke-[2.2] text-blue-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Text Message */}
                {msg.type === 'text' && (
                  <div
                    className={`${
                      isMe
                        ? 'bg-[#2563eb] text-white rounded-[20px] rounded-tr-xs'
                        : 'bg-white text-slate-900 rounded-[20px] rounded-tl-xs border border-slate-100 shadow-sm'
                    } p-3.5 max-w-[85%] sm:max-w-[310px]`}
                  >
                    <p className="text-xs leading-relaxed font-normal">{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] font-medium mt-1.5 ${
                        isMe ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />}
                    </div>
                  </div>
                )}

                {/* Right Forward/Reply Arrow for Received Messages */}
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => showToast(`Reply to ${contact.name}`)}
                    className="w-6 h-6 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition active:scale-95 self-center shrink-0"
                    aria-label="Reply to message"
                  >
                    <CornerUpRight className="w-3.5 h-3.5 -scale-x-100" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Bar */}
        <footer className="w-full px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0 z-30">
          {/* Rounded Input Pill */}
          <div className="flex-1 h-11 bg-slate-100/90 rounded-full px-3 flex items-center gap-2 border border-slate-200/40 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
            {/* Smile / Emoji Button */}
            <button
              type="button"
              onClick={() => showToast('Emoji picker opened')}
              className="text-slate-400 hover:text-slate-600 active:scale-95 transition"
              aria-label="Insert Emoji"
            >
              <Smile className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Paperclip Attachment Button */}
            <button
              type="button"
              onClick={() => showToast('Select file to attach')}
              className="text-slate-400 hover:text-slate-600 active:scale-95 transition rotate-45"
              aria-label="Attach File"
            >
              <Paperclip className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* Message Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 font-normal outline-none"
            />

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => showToast('Open camera to capture')}
              className="text-slate-400 hover:text-slate-600 active:scale-95 transition"
              aria-label="Take Photo"
            >
              <Camera className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Right Circular Mic or Send Button */}
          {inputValue.trim() ? (
            <button
              type="button"
              onClick={handleSendMessage}
              className="w-11 h-11 rounded-full bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0"
              aria-label="Send Message"
            >
              <SendHorizontal className="w-5 h-5 translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                showToast(isRecording ? 'Voice note cancelled' : 'Hold to record voice message');
              }}
              className={`w-11 h-11 rounded-full ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#2563eb] hover:bg-blue-700'
              } active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all shrink-0`}
              aria-label="Record Voice Message"
            >
              <Mic className="w-5 h-5 stroke-[2]" />
            </button>
          )}
        </footer>
      </div>

      {/* Call Dialog Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-slate-900 text-white rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-tr ${contact.avatarBg} flex items-center justify-center text-2xl font-bold mb-4 shadow-xl`}
            >
              {contact.avatarChar}
            </div>
            <h3 className="text-lg font-bold">{contact.name}</h3>
            <span className="text-xs text-blue-400 mt-1 animate-pulse">
              {showCallModal === 'video' ? 'Connecting video call...' : 'Calling mobile...'}
            </span>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowCallModal(null)}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center active:scale-95 shadow-lg shadow-red-500/30 transition"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Diagram Full View Modal */}
      {showDiagramModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[370px] bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase font-mono">
                System Architecture Flow
              </h3>
              <button
                type="button"
                onClick={() => setShowDiagramModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 font-mono text-[10px]">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 border border-slate-300 rounded text-center">
                  <strong>User Module</strong>
                  <div className="text-slate-500 text-[8px]">Auth / Profile</div>
                </div>
                <div className="p-2 border-2 border-blue-600 bg-blue-50 rounded text-center">
                  <strong className="text-blue-700">Catalog &amp; Search</strong>
                  <div className="text-blue-600 text-[8px]">Inventory Sync</div>
                </div>
                <div className="p-2 border border-slate-300 rounded text-center">
                  <strong>Checkout</strong>
                  <div className="text-slate-500 text-[8px]">Stripe Gateway</div>
                </div>
              </div>

              <div className="text-center text-slate-400 text-[9px] py-1">
                ↕ REST APIs / WebSocket Realtime Bridge ↕
              </div>

              <div className="p-3 border border-dashed border-blue-500 bg-blue-50/50 rounded-lg text-center text-blue-900 font-semibold text-[10px]">
                Central Database &amp; Distributed Microservices Layer
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                showToast('Diagram export saved');
                setShowDiagramModal(false);
              }}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Export Diagram Specification
            </button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
