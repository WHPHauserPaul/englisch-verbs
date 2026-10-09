// LH 3.4–3.5 und 4.2: eine Liste pflegen — Einträge, Excel-Import und Zuordnung.
import * as D from '../cloud/daten.js';
import { istLehrer } from '../cloud/auth.js';
import { eintraegeLesen } from '../excel.js';
import { ART_NAME } from './listen.js';
import { el, meldung, fenster, fragen, zeile, auswahl } from '../ui.js';

export async function zeigeListe(ziel, id) {
  if (!istLehrer()) return ziel.append(el('p', {}, 'Nur für Lehrer.'));
  const [liste, eintraege, zuordnungen, gruppen, profile] =
    await Promise.all([D.liste(id), D.eintraege(id), D.zuordnungen(id), D.gruppen(), D.alleProfile()]);
  const irregular = liste.art === 'irregular';
  const neuZeichnen = async () => {
    const neu = el('div');
    await zeigeListe(neu, id);
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

  ziel.append(
    el('h1', {}, liste.name, el('span', { class: 'art' }, ART_NAME[liste.art])),
    el('div', { class: 'leiste' },
      el('a', { href: '#/listen' }, '← Listen'),
      el('span', { class: 'abstand' }),
      el('button', { onclick: umbenennen }, 'Umbenennen'),
      el('button', { onclick: loeschen }, 'Löschen')));

  // --- Zuordnung (LH 4.2) ---
  const gruppeName = gid => gruppen.find(g => g.id === gid)?.name ?? 'Gruppe eines anderen Lehrers';
  const personName = pid => profile.find(p => p.id === pid)?.name || 'Unbekannt';
  const ziele = [
    ['', 'Gruppe oder Schüler wählen …'],
    ...gruppen.filter(g => !zuordnungen.some(z => z.gruppe_id === g.id)).map(g => [`g:${g.id}`, `Gruppe ${g.name}`]),
    ...profile.filter(p => !zuordnungen.some(z => z.schueler_id === p.id)).map(p => [`s:${p.id}`, p.name || 'Ohne Namen']),
  ];
  const wahl = auswahl(ziele, '');
  ziel.append(
    el('h2', {}, 'Zugeordnet'),
    el('div', { class: 'chips' }, zuordnungen.length ? zuordnungen.map(z => el('span', { class: 'chip' },
      z.gruppe_id ? `Gruppe ${gruppeName(z.gruppe_id)}` : personName(z.schueler_id),
      el('button', { class: 'chip-weg', 'aria-label': 'Zuordnung entfernen', onclick: () => melden(() => D.zuordnungEntfernen(z.id)) }, '✕')))
      : el('span', {}, 'noch niemandem')),
    el('div', { class: 'leiste' }, wahl, el('button', {
      onclick: () => {
        if (!wahl.value) return meldung('Bitte zuerst eine Gruppe oder einen Schüler wählen');
        const [art, zielId] = wahl.value.split(':');
        melden(() => D.zuordnen(id, art === 'g' ? { gruppe_id: zielId } : { schueler_id: zielId }));
      },
    }, 'Zuordnen')));

  // --- Einträge (LH 3.4/3.5) ---
  const datei = el('input', { type: 'file', accept: '.xlsx,.xls,.csv', hidden: true, onchange: importieren });
  ziel.append(
    el('h2', {}, `Einträge (${eintraege.length})`),
    el('div', { class: 'leiste' },
      el('button', { class: 'haupt', onclick: () => bearbeiten() }, 'Neuer Eintrag'),
      el('button', { onclick: () => datei.click() }, 'Aus Excel importieren'), datei),
    el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste klickbar' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Deutsch'), el('th', {}, irregular ? 'Present' : 'Englisch'),
        irregular ? [el('th', {}, 'Past'), el('th', {}, 'Past Participle')] : null)),
      el('tbody', {}, eintraege.map(e => el('tr', { onclick: () => bearbeiten(e) },
        el('td', {}, e.deutsch), el('td', {}, e.englisch),
        irregular ? [el('td', {}, e.past ?? ''), el('td', {}, e.past_participle ?? '')] : null))))));

  function umbenennen() {
    const name = el('input', { required: true, value: liste.name });
    fenster('Liste umbenennen', el('div', { class: 'formular' }, zeile('Name', name)), 'Namen speichern',
      () => melden(() => D.listeUmbenennen(id, name.value.trim())));
  }

  async function loeschen() {
    if (!await fragen(`Liste „${liste.name}“ mit allen ${eintraege.length} Einträgen und dem Lernstand aller Schüler löschen?`)) return;
    try {
      await D.listeLoeschen(id);
      location.hash = '#/listen';
    } catch (f) { meldung(f.message); }
  }

  // LH 3.7: Ändern behält den Lernstand, weil die Karten am Eintrag hängen.
  function bearbeiten(e) {
    const felder = {
      deutsch: el('input', { required: true, value: e?.deutsch ?? '' }),
      englisch: el('input', { required: true, value: e?.englisch ?? '' }),
      past: el('input', { value: e?.past ?? '' }),
      past_participle: el('input', { value: e?.past_participle ?? '' }),
    };
    const inhalt = el('div', { class: 'formular' },
      zeile('Deutsch', felder.deutsch),
      zeile(irregular ? 'Present' : 'Englisch', felder.englisch),
      irregular ? [zeile('Past', felder.past), zeile('Past Participle', felder.past_participle)] : null);
    const d = fenster(e ? 'Eintrag bearbeiten' : 'Neuer Eintrag', inhalt, 'Eintrag speichern', () => {
      const daten = { deutsch: felder.deutsch.value.trim(), englisch: felder.englisch.value.trim() };
      if (irregular) {
        daten.past = felder.past.value.trim() || null;
        daten.past_participle = felder.past_participle.value.trim() || null;
      }
      if (e) daten.id = e.id;
      else Object.assign(daten, { liste_id: id, position: naechstePosition() });
      return melden(() => D.eintragSpeichern(daten));
    });
    if (e) d.querySelector('.knoepfe').append(el('button', {
      type: 'button', class: 'gefahr links',
      onclick: async () => {
        if (!await fragen(`Eintrag „${e.deutsch}“ löschen?`)) return;
        d.schliessen(false);
        melden(() => D.eintragLoeschen(e.id));
      },
    }, 'Löschen'));
    felder.deutsch.focus();
  }

  function naechstePosition() {
    return eintraege.reduce((m, e) => Math.max(m, e.position), 0) + 1;
  }

  // LH 3.5: Vorschau, dann anfügen.
  async function importieren() {
    const f = datei.files[0];
    datei.value = '';
    if (!f) return;
    let neu;
    try {
      neu = await eintraegeLesen(f, liste.art);
    } catch (fehler) {
      return meldung(`Datei konnte nicht gelesen werden: ${fehler.message}`);
    }
    if (!neu.length) return meldung('In der Datei wurden keine Einträge gefunden (Spalte A Deutsch, Spalte B Englisch)');
    const start = naechstePosition();
    fenster(`${neu.length} Einträge erkannt`, el('div', { class: 'tabelle-rahmen vorschau' }, el('table', { class: 'liste' },
      el('tbody', {}, neu.map(e => el('tr', {}, el('td', {}, e.deutsch), el('td', {}, e.englisch),
        irregular ? [el('td', {}, e.past ?? '–'), el('td', {}, e.past_participle ?? '–')] : null))))),
    'Einträge übernehmen', () => melden(() => D.eintraegeAnfuegen(neu.map((e, i) => ({ ...e, liste_id: id, position: start + i })))));
  }
}
