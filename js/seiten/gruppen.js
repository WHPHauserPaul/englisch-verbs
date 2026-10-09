// LH 4.1: Lehrer fassen Schüler zu Gruppen zusammen.
import * as D from '../cloud/daten.js';
import { istLehrer } from '../cloud/auth.js';
import { el, meldung, fenster, fragen, zeile, auswahl } from '../ui.js';

export async function zeigeGruppen(ziel) {
  if (!istLehrer()) return ziel.append(el('p', {}, 'Nur für Lehrer.'));
  const [gruppen, profile] = await Promise.all([D.gruppen(), D.alleProfile()]);
  const mitglieder = await Promise.all(gruppen.map(g => D.mitglieder(g.id)));
  const name = id => profile.find(p => p.id === id)?.name || 'Ohne Namen';

  const neuZeichnen = async () => {
    const neu = el('div');
    await zeigeGruppen(neu);
    ziel.replaceChildren(...neu.childNodes);
  };
  const melden = async arbeit => {
    try {
      await arbeit();
      await neuZeichnen();
    } catch (f) {
      meldung(f.message);
      return false;
    }
  };

  const namensFenster = (titel, wert, knopf, speichern) => {
    const feld = el('input', { required: true, value: wert, placeholder: 'z. B. 6b' });
    fenster(titel, el('div', { class: 'formular' }, zeile('Name', feld)), knopf, () => melden(() => speichern(feld.value.trim())));
    feld.focus();
  };

  ziel.append(
    el('h1', {}, 'Gruppen'),
    el('div', { class: 'leiste' }, el('button', {
      class: 'haupt', onclick: () => namensFenster('Neue Gruppe', '', 'Gruppe anlegen', D.gruppeAnlegen),
    }, 'Neue Gruppe')));
  if (!gruppen.length) ziel.append(el('p', {}, 'Noch keine Gruppe.'));

  gruppen.forEach((g, i) => {
    const drin = mitglieder[i];
    const wahl = auswahl([['', 'Schüler wählen …'], ...profile.filter(p => !drin.includes(p.id)).map(p => [p.id, p.name || 'Ohne Namen'])], '');
    ziel.append(el('section', { class: 'karte-rahmen' },
      el('div', { class: 'leiste' },
        el('h2', {}, g.name, el('span', { class: 'art' }, `${drin.length} Schüler`)),
        el('span', { class: 'abstand' }),
        el('button', { onclick: () => namensFenster('Gruppe umbenennen', g.name, 'Namen speichern', n => D.gruppeUmbenennen(g.id, n)) }, 'Umbenennen'),
        el('button', {
          onclick: async () => {
            if (await fragen(`Gruppe „${g.name}“ löschen? Der Lernstand der Schüler bleibt erhalten.`)) melden(() => D.gruppeLoeschen(g.id));
          },
        }, 'Löschen')),
      el('div', { class: 'chips' }, drin.map(sid => el('span', { class: 'chip' }, name(sid),
        el('button', { class: 'chip-weg', 'aria-label': 'Aus der Gruppe nehmen', onclick: () => melden(() => D.mitgliedEntfernen(g.id, sid)) }, '✕')))),
      el('div', { class: 'leiste' }, wahl, el('button', {
        onclick: () => wahl.value ? melden(() => D.mitgliedHinzu(g.id, wahl.value)) : meldung('Bitte zuerst einen Schüler wählen'),
      }, 'Hinzufügen'))));
  });
}
