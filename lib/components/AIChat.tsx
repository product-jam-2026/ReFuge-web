'use client';

import { useState } from 'react';
import { translateToHebrew } from '@/app/actions/translate';

interface AIChatProps {
  items: { question: string; answer: string }[]; // נשאר כדי לא לשבור קריאות קיימות (לא בשימוש כאן)
  locale: string; // נשאר כדי לא לשבור קריאות קיימות (לא בשימוש כאן)
  texts: {
    placeholder: string;
    title: string;
    loading: string;
  };
}

export default function AIChat({ items, locale, texts }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // ✅ תרגום מערבית -> עברית (עם redaction בצד שרת)
    const answer = await translateToHebrew(userMsg);

    setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    setLoading(false);
  };

  return (
    <>
      {/* כפתור פתיחה צף */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-[#0f172a] text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all z-50 flex items-center justify-center"
      >
        {isOpen ? (
          // אייקון X
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // אייקון רובוט/צ'אט
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
      </button>

      {/* חלונית */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          <div className="bg-[#0f172a] text-white p-4 font-bold text-center">
            {texts.title}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-10">
                👋 {texts.placeholder}
              </p>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                dir="auto"
                className={`p-3 rounded-xl text-sm max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#0f172a] text-white self-end ml-auto rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 self-start mr-auto rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="text-gray-400 text-xs animate-pulse p-2">
                {texts.loading}...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="הדבק/י טקסט בערבית לתרגום…"
              dir="auto"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#dcfccf] text-[#0f172a] p-2 rounded-full hover:bg-green-300 transition-colors disabled:opacity-50"
              title="תרגם"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
