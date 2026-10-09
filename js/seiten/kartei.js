// LH 5.3 / 5.4 / 6.2: Kartei einer Liste mit Lernen, Fächern je Richtung und Zurücksetzen.
import * as D from '../cloud/daten.js';
import { RICHTUNGEN, richtungName, istFaellig, verteilung, naechsteFaelligkeit, datumText } from '../karteikasten.js';
import { listenStand } from './start.js';
import { el, meldung, fragen, auswahl } from '../ui.js';

// LH 5.4: gewählte Abfragerichtung je Liste, auf dem Gerät gemerkt. Leer heißt alle Richtungen.
export function gewaehlteRichtung(liste) {
  let r = '';
  try { r = localStorage.getItem(`richtung-${liste.id}`) ?? ''; } catch { /* ohne Speicher: alle */ }
  return RICHTUNGEN[liste.art].includes(r) ? r : '';
}

function richtungMerken(liste, r) {
  try { localStorage.setItem(`richtung-${liste.id}`, r); } catch { /* dann eben nicht gemerkt */ }
}

export const inRichtung = (karten, r) => r ? karten.filter(k => k.richtung === r) : karten;

export async function zeigeKartei(ziel, id) {
  const liste = await D.liste(id);
  const alle = await listenStand(liste);
  const richtung = gewaehlteRichtung(liste);
  const karten = inRichtung(alle, richtung);
  const faellig = karten.filter(istFaellig).length;

  const wahl = auswahl([['', 'Alle Richtungen'], ...RICHTUNGEN[liste.art].map(r => [r, richtungName(liste.art, r)])], richtung, {
    onchange: () => {
      richtungMerken(liste, wahl.value);
      neuZeichnen();
    },
  });
  async function neuZeichnen() {
    const neu = el('div');
    await zeigeKartei(neu, id);
    ziel.replaceChildren(...neu.childNodes);
  }

  ziel.append(
    el('h1', {}, liste.name),
    el('div', { class: 'leiste richtung-wahl' }, el('label', {}, 'Richtung'), wahl),
    el('div', { class: 'grosse-knoepfe' },
      el('button', {
        class: 'haupt gross',
        onclick: () => {
          if (faellig) return (location.hash = `#/lernen/${id}`);
          const naechste = naechsteFaelligkeit(karten);
          meldung(naechste ? `Heute ist nichts fällig, nächste Karten am ${datumText(naechste)}` : 'Heute ist nichts fällig', 'info');
        },
      }, faellig ? `Lernen (${faellig})` : 'Lernen')));

  // LH 6.2: jede Richtung als eigene Kartei.
  ziel.append(el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste faecher' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Fach'), [1, 2, 3, 4, 5].map(f => el('th', { class: `zahl fach${f}` }, f)))),
    el('tbody', {}, RICHTUNGEN[liste.art].map(r => {
      const n = verteilung(alle.filter(k => k.richtung === r));
      return el('tr', {}, el('td', {}, richtungName(liste.art, r)), n.map(x => el('td', { class: 'zahl' }, x)));
    })))));

  ziel.append(el('div', { class: 'leiste unten' },
    el('a', { href: '#/' }, '← Zurück'),
    el('span', { class: 'abstand' }),
    el('button', {
      class: 'leise',
      onclick: async () => {
        if (!await fragen(`Den Fortschritt für „${liste.name}“ zurücksetzen? Alle Karten kommen zurück in Fach 1.`, 'Zurücksetzen')) return;
        try {
          await D.fortschrittLoeschen(id);
          await neuZeichnen();
        } catch (f) { meldung(f.message); }
      },
    }, 'Fortschritt zurücksetzen')));
}
