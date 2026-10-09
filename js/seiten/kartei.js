// LH 5.3 / 6.2: Kartei einer Liste mit Lernen, Alles üben, Fächern je Richtung und Zurücksetzen.
import * as D from '../cloud/daten.js';
import { RICHTUNGEN, richtungName, istFaellig, verteilung, naechsteFaelligkeit, datumText } from '../karteikasten.js';
import { listenStand } from './start.js';
import { el, meldung, fragen } from '../ui.js';

export async function zeigeKartei(ziel, id) {
  const liste = await D.liste(id);
  const karten = await listenStand(liste);
  const faellig = karten.filter(istFaellig).length;

  ziel.append(
    el('h1', {}, liste.name),
    el('div', { class: 'grosse-knoepfe' },
      el('button', {
        class: 'haupt gross',
        onclick: () => {
          if (faellig) return (location.hash = `#/lernen/${id}`);
          const naechste = naechsteFaelligkeit(karten);
          meldung(naechste ? `Heute ist nichts fällig, nächste Karten am ${datumText(naechste)}` : 'Heute ist nichts fällig', 'info');
        },
      }, faellig ? `Lernen (${faellig})` : 'Lernen'),
      el('button', {
        class: 'gross',
        onclick: () => karten.length ? (location.hash = `#/ueben/${id}`) : meldung('Die Liste hat noch keine Einträge'),
      }, 'Alles üben')));

  // LH 6.2: jede Richtung als eigene Kartei.
  ziel.append(el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste faecher' },
    el('thead', {}, el('tr', {}, el('th', {}, 'Fach'), [1, 2, 3, 4, 5].map(f => el('th', { class: `zahl fach${f}` }, f)))),
    el('tbody', {}, RICHTUNGEN[liste.art].map(r => {
      const n = verteilung(karten.filter(k => k.richtung === r));
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
          const neu = el('div');
          await zeigeKartei(neu, id);
          ziel.replaceChildren(...neu.childNodes);
        } catch (f) { meldung(f.message); }
      },
    }, 'Fortschritt zurücksetzen')));
}
