// LH 7.3: englische Aussprache über die Sprachausgabe des Browsers, ohne Zusatzkosten.
import { el } from './ui.js';

function stimme() {
  const stimmen = speechSynthesis.getVoices();
  return stimmen.find(s => s.lang === 'en-GB') ?? stimmen.find(s => s.lang.startsWith('en'));
}

export function sprechen(text) {
  if (!('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const s = new SpeechSynthesisUtterance(text);
  s.lang = 'en-GB';
  const v = stimme();
  if (v) s.voice = v;
  s.rate = 0.9;
  speechSynthesis.speak(s);
  return true;
}

// Lautsprecher-Knopf neben einem englischen Wort. Meldet, wenn das Gerät keine Sprachausgabe hat.
export function lautsprecher(text, melden) {
  return el('button', {
    type: 'button', class: 'lautsprecher', 'aria-label': `„${text}“ vorlesen`,
    onclick: ev => {
      ev.stopPropagation();
      if (!sprechen(text)) melden('Dieses Gerät kann nicht vorlesen');
    },
  }, '🔊');
}
