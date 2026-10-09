// Eigenes Konto: Name, Passwort, Abmelden.
import * as D from '../cloud/daten.js';
import { aktuelleSitzung, abmelden, profilNeuLaden } from '../cloud/auth.js';
import { zeigePasswortSetzenDialog } from './passwortSetzen.js';
import { el, meldung, zeile } from '../ui.js';

const ROLLE = { schueler: 'Schüler', lehrer: 'Lehrer', admin: 'Admin' };

export function zeigeKonto(ziel) {
  const { user, profil } = aktuelleSitzung();
  const name = el('input', { required: true, value: profil.name });
  ziel.append(
    el('h1', {}, 'Konto'),
    el('form', {
      class: 'formular',
      onsubmit: async ev => {
        ev.preventDefault();
        try {
          await D.nameAendern(name.value.trim());
          await profilNeuLaden();
        } catch (f) { meldung(f.message); }
      },
    },
      zeile('Name', name),
      el('label', {}, 'E-Mail'), el('span', {}, user.email),
      el('label', {}, 'Rolle'), el('span', {}, ROLLE[profil.rolle]),
      el('div', { class: 'knoepfe' }, el('button', { type: 'submit', class: 'haupt' }, 'Namen speichern'))),
    el('div', { class: 'leiste unten' },
      el('button', { onclick: () => zeigePasswortSetzenDialog(true) }, 'Passwort ändern'),
      el('button', { onclick: abmelden }, 'Abmelden')));
}
