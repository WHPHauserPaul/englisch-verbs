// LH 8: Lehreransicht — Fortschritt je Gruppe und Liste, Problemwörter, Zurücksetzen.
import * as D from '../cloud/daten.js';
import { istLehrer } from '../cloud/auth.js';
import { kartenBilden, verteilung, richtungName, datumText } from '../karteikasten.js';
import { el, meldung, fenster, fragen, auswahl } from '../ui.js';

// Die zuletzt gewählte Gruppe und Liste merken, damit man nicht jedes Mal neu wählen muss.
function merken(schluessel, wert) {
  try { localStorage.setItem(schluessel, wert); } catch { /* ohne Speicher eben ohne Merken */ }
}
function erinnern(schluessel) {
  try { return localStorage.getItem(schluessel); } catch { return null; }
}

export async function zeigeFortschritt(ziel) {
  if (!istLehrer()) return ziel.append(el('p', {}, 'Nur für Lehrer.'));
  const [gruppen, listen, profile] = await Promise.all([D.gruppen(), D.alleListen(), D.alleProfile()]);
  ziel.append(el('h1', {}, 'Fortschritt'));
  if (!gruppen.length || !listen.length) {
    ziel.append(el('p', {}, 'Dafür braucht es mindestens eine Gruppe und eine Liste.'));
    return;
  }
  const finde = (feld, id) => feld.find(x => x.id === id)?.id ?? feld[0].id;
  const gruppeWahl = auswahl(gruppen.map(g => [g.id, g.name]), finde(gruppen, erinnern('fortschritt-gruppe')), { onchange: laden });
  const listeWahl = auswahl(listen.map(l => [l.id, l.name]), finde(listen, erinnern('fortschritt-liste')), { onchange: laden });
  const bereich = el('div');
  ziel.append(el('div', { class: 'leiste' }, gruppeWahl, listeWahl), bereich);
  await laden();

  async function laden() {
    merken('fortschritt-gruppe', gruppeWahl.value);
    merken('fortschritt-liste', listeWahl.value);
    try {
      const liste = listen.find(l => l.id === listeWahl.value);
      const [ids, eintraege] = await Promise.all([D.mitglieder(gruppeWahl.value), D.eintraege(liste.id)]);
      const staende = ids.length ? await D.staendeVon(liste.id, ids) : [];
      const schueler = ids.map(id => {
        const eigene = staende.filter(s => s.schueler_id === id);
        const karten = kartenBilden(liste, eintraege, eigene);
        return {
          id, name: profile.find(p => p.id === id)?.name || 'Ohne Namen', karten,
          n: verteilung(karten),
          zuletzt: eigene.map(s => s.zuletzt).filter(Boolean).sort().at(-1),
        };
      }).sort((a, b) => a.name.localeCompare(b.name, 'de'));

      bereich.replaceChildren(!schueler.length ? el('p', {}, 'Die Gruppe hat noch keine Schüler.') :
        el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste klickbar' },
          el('thead', {}, el('tr', {}, el('th', {}, 'Schüler'), [1, 2, 3, 4, 5].map(f => el('th', { class: 'zahl' }, `F${f}`)),
            el('th', { class: 'zahl' }, 'gelernt'), el('th', {}, 'zuletzt'))),
          el('tbody', {}, schueler.map(s => el('tr', { onclick: () => details(liste, s) },
            el('td', {}, s.name), s.n.map(x => el('td', { class: 'zahl' }, x)),
            el('td', { class: 'zahl' }, s.karten.length ? `${Math.round(s.n[4] / s.karten.length * 100)} %` : '–'),
            el('td', {}, s.zuletzt ? datumText(s.zuletzt.slice(0, 10)) : 'nie')))))));
    } catch (f) {
      meldung(f.message);
    }
  }

  // LH 8.2/8.3: Problemwörter eines Schülers und Zurücksetzen.
  function details(liste, s) {
    const problem = s.karten.filter(k => k.anzahl_falsch > 0).sort((a, b) => b.anzahl_falsch - a.anzahl_falsch).slice(0, 10);
    const d = fenster(`${s.name} · ${liste.name}`, el('div', {},
      el('h3', {}, 'Problemwörter'),
      problem.length ? el('table', { class: 'liste' }, el('tbody', {}, problem.map(k => el('tr', {},
        el('td', {}, k.eintrag.deutsch), el('td', {}, k.eintrag.englisch),
        el('td', { class: 'klein' }, richtungName(liste.art, k.richtung)), el('td', { class: 'zahl' }, `${k.anzahl_falsch}× ✗`)))))
        : el('p', {}, 'keine')),
    'Fortschritt zurücksetzen', async () => {
      if (!await fragen(`Fortschritt von ${s.name} für „${liste.name}“ zurücksetzen? Alle Karten kommen zurück in Fach 1.`, 'Zurücksetzen')) return false;
      try {
        await D.fortschrittLoeschen(liste.id, s.id);
        await laden();
      } catch (f) {
        meldung(f.message);
        return false;
      }
    });
    d.querySelector('.knoepfe button[type=submit]').classList.replace('haupt', 'gefahr');
    d.querySelector('.knoepfe button[type=button]').textContent = 'Schließen';
  }
}
