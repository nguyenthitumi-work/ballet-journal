'use client';

import { useEffect, useState } from 'react';

interface PronounceButtonProps {
  text: string;
  lang?: string;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const langLower = lang.toLowerCase();
  const langPrefix = langLower.split('-')[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === langLower) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix))
  );
}

export function PronounceButton({ text, lang = 'fr-FR' }: PronounceButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    // Prime the voice list — some browsers populate it asynchronously.
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      window.speechSynthesis.cancel();
    };
  }, []);

  function handleClick() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Hear ${text} pronounced`}
      title={`Hear ${text} pronounced`}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-300 bg-white text-violet-700 shadow-sm transition hover:border-violet-500 hover:text-violet-800 ${
        speaking ? 'animate-pulse border-violet-500 text-violet-800' : ''
      }`}
    >
      <span aria-hidden className="text-base leading-none">
        {speaking ? '🔊' : '🔉'}
      </span>
    </button>
  );
}
