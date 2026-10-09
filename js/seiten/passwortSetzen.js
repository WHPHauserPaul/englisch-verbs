// LH 2.2: nach dem Klick auf den Link in der Einladungs- oder Passwort-vergessen-E-Mail das
// eigene Passwort festlegen.
import { passwortSetzen } from '../cloud/auth.js';
import { el, meldung, fenster, zeile } from '../ui.js';

// abbrechbar: unter "Konto" darf man es sich anders überlegen, nach dem E-Mail-Link nicht.
export function zeigePasswortSetzenDialog(abbrechbar = false) {
  const neu = el('input', { type: 'password', autocomplete: 'new-password', required: true });
  const wiederholen = el('input', { type: 'password', autocomplete: 'new-password', required: true });
  const d = fenster(abbrechbar ? 'Passwort ändern' : 'Passwort festlegen', el('div', { class: 'formular' },
    zeile('Neues Passwort', neu),
    zeile('Wiederholen', wiederholen)), 'Passwort speichern', async () => {
    if (neu.value.length < 6) {
      meldung('Das Passwort muss mindestens 6 Zeichen haben');
      return false;
    }
    if (neu.value !== wiederholen.value) {
      meldung('Die Passwörter stimmen nicht überein');
      return false;
    }
    const fehler = await passwortSetzen(neu.value);
    if (fehler) {
      meldung(fehler);
      return false;
    }
  });
  if (!abbrechbar) d.querySelector('.knoepfe button[type=button]')?.remove();
  neu.focus();
}
