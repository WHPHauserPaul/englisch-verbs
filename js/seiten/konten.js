// LH 2.2/2.3: Konten anlegen und Rollen vergeben, nur der Admin.
import * as D from '../cloud/daten.js';
import { istAdmin, appAdresse } from '../cloud/auth.js';
import { el, meldung, fenster, zeile, auswahl } from '../ui.js';

const ROLLEN = [['schueler', 'Schüler'], ['lehrer', 'Lehrer'], ['admin', 'Admin']];

export async function zeigeKonten(ziel) {
  if (!istAdmin()) return ziel.append(el('p', {}, 'Nur für den Admin.'));
  const profile = await D.alleProfile();
  ziel.append(
    el('h1', {}, 'Konten'),
    el('div', { class: 'leiste' }, el('button', { class: 'haupt', onclick: neuesKonto }, 'Neues Konto')),
    el('div', { class: 'tabelle-rahmen' }, el('table', { class: 'liste' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Name'), el('th', {}, 'E-Mail'), el('th', {}, 'Rolle'))),
      el('tbody', {}, profile.map(p => {
        const rolle = auswahl(ROLLEN, p.rolle, {
          onchange: async () => {
            try {
              await D.rolleSetzen(p.id, rolle.value);
              p.rolle = rolle.value;
            } catch (f) {
              meldung(f.message);
              rolle.value = p.rolle;
            }
          },
        });
        return el('tr', {}, el('td', {}, p.name || 'Ohne Namen'), el('td', {}, p.email ?? ''), el('td', {}, rolle));
      })))));

  function neuesKonto() {
    const name = el('input', { required: true, placeholder: 'Vorname' });
    const email = el('input', { type: 'email', required: true });
    const rolle = auswahl(ROLLEN, 'schueler');
    fenster('Neues Konto', el('div', { class: 'formular' }, zeile('Name', name), zeile('E-Mail', email), zeile('Rolle', rolle)),
      'Konto anlegen', async () => {
        try {
          await D.kontoAnlegen(email.value.trim(), name.value.trim(), rolle.value, appAdresse);
        } catch (f) {
          meldung(`Konto nicht angelegt: ${f.message}`);
          return false;
        }
        // Die E-Mail sieht man hier nicht, deshalb ausnahmsweise eine Bestätigung.
        meldung(`${email.value.trim()} bekommt jetzt eine E-Mail zum Festlegen des Passworts.`, 'info');
        const neu = el('div');
        await zeigeKonten(neu);
        ziel.replaceChildren(...neu.childNodes);
      });
    name.focus();
  }
}
