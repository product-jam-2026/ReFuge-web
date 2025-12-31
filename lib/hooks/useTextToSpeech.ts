import { useState, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const stop = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string, locale: string) => {
    if (typeof window === 'undefined') return;

    if (isSpeaking) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();

    // 1. ניקוי הטקסט מגרשיים וסימנים מיוחדים
    const textToRead = text.replace(/['"״׳]/g, ""); 
    
    // 2. שליחת הטקסט *המנוקה* למנוע הדיבור (כאן היה הפספוס קודם)
    const utterance = new SpeechSynthesisUtterance(textToRead);

    let lang = 'en-US';
    if (locale === 'he') lang = 'he-IL';
    if (locale === 'ar') lang = 'ar-SA';
    
    utterance.lang = lang;
    utterance.rate = 0.9; 

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { speak, stop, isSpeaking };
};