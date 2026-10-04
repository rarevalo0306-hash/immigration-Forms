/**
 * Reads a question or sentence aloud with the browser's own voices (speechSynthesis), so the
 * person hears how the officer may say it. Nothing is sent anywhere by Camino; on most phones the
 * voices work offline. When the browser has no voices, the "Escuchar" buttons don't show.
 */

export type Voice = 'en-US' | 'es-US';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

function pickVoice(lang: Voice): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2);
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.replace('_', '-').startsWith(base));
}

export function speak(text: string, lang: Voice = 'en-US', rate = 0.9) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  synth.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
