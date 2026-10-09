// LH 5.1/5.2: je zugeordneter Liste eine Kachel mit fälligen Karten und Fächerbalken.
import * as D from '../cloud/daten.js';
import { kartenBilden, istFaellig, verteilung } from '../karteikasten.js';
import { el } from '../ui.js';

export async function listenStand(liste) {
  const [eintraege, staende] = await Promise.all([D.eintraege(liste.id), D.staende(liste.id)]);
  return kartenBilden(liste, eintraege, staende);
}

// Fünf Abschnitte, Breite nach Anzahl Karten im Fach (LH 5.2).
export function faecherBalken(n) {
  const summe = n.reduce((a, b) => a + b, 0) || 1;
  return el('div', { class: 'balken', 'aria-label': n.map((x, i) => `Fach ${i + 1}: ${x}`).join(', ') },
    n.map((x, i) => x ? el('span', { class: `fach${i + 1}`, style: `flex-grow:${x / summe}` }) : null));
}

export async function zeigeStart(ziel) {
  const listen = await D.meineListen();
  ziel.append(el('h1', {}, 'Lernen'));
  if (!listen.length) {
    ziel.append(el('p', {}, 'Dir ist noch keine Liste zugeordnet.'));
    return;
  }
  const staende = await Promise.all(listen.map(listenStand));
  ziel.append(el('div', { class: 'kacheln' }, listen.map((liste, i) => {
    const karten = staende[i];
    const faellig = karten.filter(istFaellig).length;
    const n = verteilung(karten);
    const gelernt = karten.length ? Math.round(n[4] / karten.length * 100) : 0;
    return el('a', { class: 'kachel', href: `#/kartei/${liste.id}` },
      el('div', { class: 'kachel-name' }, liste.name),
      el('div', { class: faellig ? 'kachel-faellig' : 'kachel-ruhig' }, faellig ? `${faellig} fällig` : 'nichts fällig'),
      faecherBalken(n),
      el('div', { class: 'kachel-klein' }, `${gelernt} % gelernt`));
  })));
}
