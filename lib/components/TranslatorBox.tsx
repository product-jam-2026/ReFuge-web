'use client';

import { useState } from 'react';
import { translateToHebrew } from '@/app/actions/translate'; // מייבאים את המנוע שבנינו

export default function TranslatorBox() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!input) return;
    setLoading(true);
    
    // שליחת הטקסט למנוע וקבלת תשובה
    const result = await translateToHebrew(input);
    
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mt-6">
      <h3 className="font-bold mb-2">מתרגם לעברית</h3>
      
      <textarea
        className="w-full p-2 border rounded bg-gray-50 mb-2"
        rows={3}
        placeholder="כתוב כאן באנגלית או בערבית..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button 
        onClick={handleTranslate}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded-full text-sm w-full font-bold"
      >
        {loading ? "מתרגם..." : "תרגם עכשיו"}
      </button>

      {output && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-right border border-blue-100">
          <p className="font-bold text-blue-600 text-sm mb-1">תרגום:</p>
          <p>{output}</p>
        </div>
      )}
    </div>
  );
}