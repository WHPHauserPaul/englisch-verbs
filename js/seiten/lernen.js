// LH 7: Lernrunde. Immer gleicher Ablauf: Frage, auf Zettel schreiben, Lösung zeigen, selbst bewerten.
import * as D from '../cloud/daten.js';
import { richtungName, istFaellig, bewerten, mischen, gleicheBedeutung } from '../karteikasten.js';
import { listenStand } from './start.js';
import { gewaehlteRichtung, inRichtung } from './kartei.js';
import { lautsprecher } from '../sprechen.js';
import { el, meldung } from '../ui.js';


const NOTEN = [
  ['richtig', '✓', 'Richtiges Wort, richtig geschrieben'],
  ['fast', '~', 'Richtiges Wort, falsch geschrieben'],
  ['falsch', '✗', 'Falsches Wort'],
];

// Ein englisches Wort mit Lautsprecher (LH 7.3).
const englisch = text => el('span', { class: 'wort' }, text || '–', text ? lautsprecher(text, meldung) : null);

// LH 3.8: Beispielsatz klein unter der Lösung, erst nach „Lösung zeigen“, weil er das englische Wort enthält.
const beispiel = e => e.beispiel ? el('div', { class: 'beispiel' }, e.beispiel, lautsprecher(e.beispiel, meldung)) : null;

function frageUndLoesung(k) {
  const e = k.eintrag;
  if (k.richtung === 'de_en') {
    // LH 7.11: nach einer Verwechslung nennt die Frage, welches Verb diesmal nicht gemeint ist.
    const nicht = k.nicht?.length ? ` (nicht ${k.nicht.map(x => x.englisch).join(', ')})` : '';
    return { frage: el('span', { class: 'wort' }, e.deutsch + nicht), loesung: [englisch(e.englisch), beispiel(e)] };
  }
  if (k.richtung === 'en_de') return { frage: englisch(e.englisch), loesung: [el('span', { class: 'wort' }, e.deutsch), beispiel(e)] };
  // LH 6.1 c: Grundform → beide Vergangenheitsformen, eine gemeinsame Bewertung (LH 6.6).
  return {
    frage: englisch(e.englisch),
    loesung: [el('span', { class: 'formen' }, englisch(e.past), el('span', { class: 'trenner' }, '·'), englisch(e.past_participle)), beispiel(e)],
  };
}

export async function zeigeLernen(ziel, id) {
  const liste = await D.liste(id);
  const alle = await listenStand(liste);
  // LH 5.4: nur die auf der Kartei gewählte Richtung.
  const auswahlKarten = inRichtung(alle, gewaehlteRichtung(liste));
  let stapel = mischen(auswahlKarten.filter(istFaellig));
  if (!stapel.length) {
    location.hash = `#/kartei/${id}`;
    return;
  }
  const eintraege = [...new Set(alle.map(k => k.eintrag))];
  // Nur die erste Antwort je Karte zählt (LH 6.5); Wiederholungen in der Runde ändern das Fach nicht.
  const ersteNote = new Map();
  let aufgedeckt = false;
  // LH 7.11: mögliche Verben der aktuellen Karte und das, welches das Kind angetippt hat.
  let moegliche = [];
  let gewaehlt = null;

  const zaehler = el('span', { class: 'zaehler' });
  const flaeche = el('div', { class: 'lernkarte' });
  ziel.append(
    el('div', { class: 'lernkopf' },
      el('span', { class: 'lern-titel' }, liste.name),
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
    const { frage, loesung } = frageUndLoesung(k);
    k.loesung = loesung;
    gewaehlt = null;
    moegliche = k.richtung === 'de_en'
      ? [k.eintrag, ...gleicheBedeutung(k.eintrag, eintraege).filter(e => !k.nicht?.includes(e))]
        .sort((a, b) => a.englisch.localeCompare(b.englisch))
      : [];
    // LH 7.11: mehrere richtige Verben → alle zeigen, das Kind tippt an, welches es geschrieben hat.
    if (moegliche.length > 1) {
      k.loesung = el('div', { class: 'auswahl' }, moegliche.map(e => {
        const zeile = el('div', {
          class: 'option', role: 'button', tabindex: 0,
          onclick: () => {
            gewaehlt = e;
            zeile.parentNode.querySelectorAll('.option').forEach(o => o.classList.toggle('gewaehlt', o === zeile));
          },
        }, englisch(e.englisch), beispiel(e));
        return zeile;
      }));
    }
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
    if (moegliche.length > 1 && note !== 'falsch' && !gewaehlt) {
      return meldung('Bitte zuerst antippen, welches Verb du geschrieben hast');
    }
    const k = stapel.shift();
    // ✗ heißt „falsches Wort“ und gilt deshalb immer für die gefragte Karte.
    if (gewaehlt && gewaehlt !== k.eintrag && note !== 'falsch') {
      // LH 7.11: Die Bewertung gilt für das angetippte Verb. Die gefragte Karte kommt in der
      // Runde noch einmal, mit dem Hinweis, welches Verb nicht gemeint ist.
      const andere = alle.find(x => x.eintrag === gewaehlt && x.richtung === 'de_en');
      stapel = stapel.filter(x => x !== andere);
      werten(andere, note);
      k.nicht = [...(k.nicht ?? []), gewaehlt];
      zurueckstellen(k);
    } else {
      werten(k, note);
    }
    if (stapel.length) zeigen();
    else ende();
  }

  function werten(k, note) {
    if (!ersteNote.has(k)) {
      ersteNote.set(k, note);
      // Sofort speichern, damit ein Abbruch nichts verliert (LH 7.6).
      D.standSpeichern(bewerten(k, note)).catch(f => meldung(`Nicht gespeichert: ${f.message}`));
    }
    if (note !== 'richtig') zurueckstellen(k);
  }

  // LH 7.4: nicht gewusst → frühestens nach 3 anderen Karten noch einmal, bis sie sitzt.
  function zurueckstellen(k) {
    stapel.splice(Math.min(3, stapel.length), 0, k);
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
