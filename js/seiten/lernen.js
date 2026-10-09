// LH 7: Lernrunde. Immer gleicher Ablauf: Frage, auf Zettel schreiben, Lösung zeigen, selbst bewerten.
import * as D from '../cloud/daten.js';
import { richtungName, istFaellig, bewerten, mischen } from '../karteikasten.js';
import { listenStand } from './start.js';
import { lautsprecher } from '../sprechen.js';
import { el, meldung } from '../ui.js';

export const zeigeLernen = (ziel, id) => runde(ziel, id, true);
// LH 7.9: alle Karten, ohne die Fächer zu verändern.
export const zeigeUeben = (ziel, id) => runde(ziel, id, false);

const NOTEN = [
  ['richtig', '✓', 'Richtiges Wort, richtig geschrieben'],
  ['fast', '~', 'Richtiges Wort, falsch geschrieben'],
  ['falsch', '✗', 'Falsches Wort'],
];

// Ein englisches Wort mit Lautsprecher (LH 7.3).
const englisch = text => el('span', { class: 'wort' }, text || '–', text ? lautsprecher(text, meldung) : null);

function frageUndLoesung(liste, k) {
  const e = k.eintrag;
  if (k.richtung === 'de_en') return { frage: el('span', { class: 'wort' }, e.deutsch), loesung: englisch(e.englisch) };
  if (k.richtung === 'en_de') return { frage: englisch(e.englisch), loesung: el('span', { class: 'wort' }, e.deutsch) };
  // LH 6.1 c: Grundform → beide Vergangenheitsformen, eine gemeinsame Bewertung (LH 6.6).
  return {
    frage: englisch(e.englisch),
    loesung: el('span', { class: 'formen' }, englisch(e.past), el('span', { class: 'trenner' }, '·'), englisch(e.past_participle)),
  };
}

async function runde(ziel, id, zaehlt) {
  const liste = await D.liste(id);
  const alle = await listenStand(liste);
  let stapel = mischen(zaehlt ? alle.filter(istFaellig) : alle);
  if (!stapel.length) {
    location.hash = `#/kartei/${id}`;
    return;
  }
  // Nur die erste Antwort je Karte zählt (LH 6.5); Wiederholungen in der Runde ändern das Fach nicht.
  const ersteNote = new Map();
  let aufgedeckt = false;

  const zaehler = el('span', { class: 'zaehler' });
  const flaeche = el('div', { class: 'lernkarte' });
  ziel.append(
    el('div', { class: 'lernkopf' },
      el('span', { class: 'lern-titel' }, zaehlt ? liste.name : `${liste.name} · üben`),
      zaehler,
      el('button', { onclick: ende }, 'Beenden')),
    flaeche);

  // Am PC: Leertaste/Enter zeigt die Lösung, 1/2/3 bewertet.
  const tasten = ev => {
    if (!ziel.isConnected) return document.removeEventListener('keydown', tasten);
    if (document.querySelector('dialog[open]') || !stapel.length) return;
    if (!aufgedeckt && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); aufdecken(); }
    else if (aufgedeckt && ['1', '2', '3'].includes(ev.key)) noteGeben(NOTEN[Number(ev.key) - 1][0]);
  };
  document.addEventListener('keydown', tasten);

  zeigen();

  function zeigen() {
    aufgedeckt = false;
    zaehler.textContent = stapel.length === 1 ? 'noch 1 Karte' : `noch ${stapel.length} Karten`;
    const k = stapel[0];
    const { frage, loesung } = frageUndLoesung(liste, k);
    k.loesung = loesung;
    flaeche.replaceChildren(
      el('div', { class: 'richtung' }, richtungName(liste.art, k.richtung)),
      el('div', { class: 'frage' }, frage),
      el('div', { class: 'loesung-platz' }),
      el('div', { class: 'aktion' }, el('button', { class: 'haupt gross', onclick: aufdecken }, 'Lösung zeigen')));
  }

  function aufdecken() {
    aufgedeckt = true;
    flaeche.querySelector('.loesung-platz').replaceChildren(el('div', { class: 'loesung' }, stapel[0].loesung));
    flaeche.querySelector('.aktion').replaceChildren(el('div', { class: 'noten' },
      NOTEN.map(([note, zeichen, titel]) =>
        el('button', { class: `note ${note}`, title: titel, 'aria-label': titel, onclick: () => noteGeben(note) }, zeichen))));
  }

  function noteGeben(note) {
    const k = stapel.shift();
    if (!ersteNote.has(k)) {
      ersteNote.set(k, note);
      // Sofort speichern, damit ein Abbruch nichts verliert (LH 7.6).
      if (zaehlt) D.standSpeichern(bewerten(k, note)).catch(f => meldung(`Nicht gespeichert: ${f.message}`));
    }
    // LH 7.4: nicht gewusst → frühestens nach 3 anderen Karten noch einmal, bis sie sitzt.
    if (note !== 'richtig') stapel.splice(Math.min(3, stapel.length), 0, k);
    if (stapel.length) zeigen();
    else ende();
  }

  // LH 7.8: Übersicht der ersten Antworten.
  function ende() {
    document.removeEventListener('keydown', tasten);
    if (!ersteNote.size) {
      location.hash = `#/kartei/${id}`;
      return;
    }
    stapel = [];
    const zahl = note => [...ersteNote.values()].filter(n => n === note).length;
    ziel.replaceChildren(el('div', { class: 'lernkarte' },
      el('h2', {}, 'Runde beendet'),
      el('div', { class: 'ergebnis' }, NOTEN.map(([note, zeichen]) =>
        el('div', { class: `ergebnis-zeile ${note}` }, el('span', { class: 'zeichen' }, zeichen), el('span', {}, zahl(note))))),
      el('div', { class: 'aktion' }, el('a', { class: 'knopf haupt gross', href: `#/kartei/${id}` }, 'Zur Kartei'))));
  }
}
