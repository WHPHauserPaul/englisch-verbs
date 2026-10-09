// LH 3.4: alle Lernlisten für Lehrer, neue Liste anlegen.
import * as D from '../cloud/daten.js';
import { istLehrer } from '../cloud/auth.js';
import { el, meldung, fenster, zeile, auswahl } from '../ui.js';

export const ART_NAME = { vokabeln: 'Vokabeln', irregular: 'Irregular Verbs' };

export async function zeigeListen(ziel) {
  if (!istLehrer()) return ziel.append(el('p', {}, 'Nur für Lehrer.'));
  const listen = await D.alleListen();
  ziel.append(
    el('h1', {}, 'Listen'),
    el('div', { class: 'leiste' }, el('button', { class: 'haupt', onclick: neueListe }, 'Neue Liste')),
    el('table', { class: 'liste klickbar' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Name'), el('th', {}, 'Art'), el('th', { class: 'zahl' }, 'Einträge'))),
      el('tbody', {}, listen.map(l => el('tr', { onclick: () => (location.hash = `#/liste/${l.id}`) },
        el('td', {}, l.name), el('td', {}, ART_NAME[l.art]), el('td', { class: 'zahl' }, l.eintrag[0]?.count ?? 0))))));
}

function neueListe() {
  const name = el('input', { required: true, placeholder: 'z. B. Verbs Unit 1' });
  const art = auswahl(Object.entries(ART_NAME), 'vokabeln');
  fenster('Neue Liste', el('div', { class: 'formular' }, zeile('Name', name), zeile('Art', art)), 'Liste anlegen', async () => {
    try {
      const neu = await D.listeAnlegen(name.value.trim(), art.value);
      location.hash = `#/liste/${neu.id}`;
    } catch (f) {
      meldung(f.message);
      return false;
    }
  });
  name.focus();
}
