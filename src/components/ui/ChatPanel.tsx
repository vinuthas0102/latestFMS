import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X, Plus, Download, CheckCircle, User, Shield } from 'lucide-react';

export interface ChatEntry {
  id: string;
  author_id: string;
  author_role: 'employee' | 'eo' | 'system';
  message: string;
  document_urls: string[];
  created_at: string;
}

interface ChatPanelProps {
  breadcrumb?: React.ReactNode;
  chats: ChatEntry[];
  loading?: boolean;
  currentUserId: string;
  onSend: (message: string, documentUrls: string[]) => Promise<void>;
  onCloseService?: () => void;
  canCloseService?: boolean;
  placeholder?: string;
  closedAt?: string | null;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  breadcrumb,
  chats,
  loading = false,
  currentUserId,
  onSend,
  onCloseService,
  canCloseService = false,
  placeholder = 'Type your message…',
  closedAt,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [docUrls, setDocUrls] = useState<string[]>([]);
  const [docInput, setDocInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showDocInput, setShowDocInput] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const addDocUrl = () => {
    const url = docInput.trim();
    if (url) { setDocUrls(prev => [...prev, url]); setDocInput(''); }
  };

  const handleSend = async () => {
    if (!message.trim() && docUrls.length === 0) return;
    setSending(true);
    try {
      await onSend(message.trim(), docUrls);
      setMessage('');
      setDocUrls([]);
      setShowDocInput(false);
    } finally {
      setSending(false);
    }
  };

  const roleConfig = {
    employee: { label: 'You',    bg: 'bg-blue-600',   icon: <User size={11} /> },
    eo:       { label: 'EO',     bg: 'bg-emerald-600', icon: <Shield size={11} /> },
    system:   { label: 'System', bg: 'bg-gray-500',    icon: null },
  };

  const isClosed = !!closedAt;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Top: breadcrumb ── */}
      {breadcrumb && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          {breadcrumb}
        </div>
      )}

      {/* ── Middle: chat history ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Send size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        )}

        {/* Reverse chronological — newest at bottom (standard chat) */}
        {[...chats].reverse().reverse().map(chat => {
          const isMe = chat.author_id === currentUserId;
          const rc = roleConfig[chat.author_role] ?? roleConfig.system;
          return (
            <div key={chat.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${rc.bg}`}>
                {rc.icon ?? rc.label.charAt(0)}
              </div>
              <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  {!isMe && <span className="font-semibold text-gray-600">{rc.label}</span>}
                  <span>{fmtTime(chat.created_at)}</span>
                </div>
                <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : chat.author_role === 'system'
                      ? 'bg-gray-100 text-gray-600 italic text-xs rounded-tl-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}>
                  {chat.message}
                  {chat.document_urls?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {chat.document_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 text-xs underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}
                        >
                          <Download size={11} />
                          Document {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* ── Bottom: compose area ── */}
      {isClosed ? (
        <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle size={14} className="text-emerald-500" />
            Service closed on {fmtTime(closedAt!)}
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 space-y-2">
          {/* Doc URL input */}
          {showDocInput && (
            <div className="flex gap-2">
              <input
                value={docInput}
                onChange={e => setDocInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDocUrl()}
                placeholder="Paste document URL…"
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button onClick={addDocUrl} className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                Add
              </button>
            </div>
          )}

          {/* Attached docs */}
          {docUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {docUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1">
                  <Paperclip size={10} />
                  <span className="truncate max-w-[120px]">Doc {i + 1}</span>
                  <button onClick={() => setDocUrls(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-blue-400 hover:text-blue-600">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDocInput(v => !v)}
              title="Attach document URL"
              className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors flex-shrink-0"
            >
              <Plus size={15} />
            </button>
            <textarea
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(); }}
              placeholder={placeholder}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[48px]"
            />
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {canCloseService && onCloseService && (
                <button
                  onClick={onCloseService}
                  className="px-3 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  Close
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && docUrls.length === 0)}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Ctrl+Enter to send</p>
        </div>
      )}
    </div>
  );
};
