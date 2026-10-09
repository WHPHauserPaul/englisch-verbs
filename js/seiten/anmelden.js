// LH 2.1: Anmeldung mit E-Mail und Passwort, Passwort vergessen per E-Mail-Link.
import { anmelden, passwortVergessen } from '../cloud/auth.js';
import { el, meldung } from '../ui.js';

export function zeigeAnmeldung(ziel) {
  const email = el('input', { type: 'email', autocomplete: 'username', required: true });
  const passwort = el('input', { type: 'password', autocomplete: 'current-password', required: true });

  const form = el('form', {
    class: 'formular',
    onsubmit: async ev => {
      ev.preventDefault();
      const fehler = await anmelden(email.value.trim(), passwort.value);
      if (fehler) meldung(fehler);
    },
  },
    el('label', {}, 'E-Mail'), email,
    el('label', {}, 'Passwort'), passwort,
    el('div', { class: 'knoepfe' },
      el('button', { type: 'submit', class: 'haupt' }, 'Anmelden'),
      el('button', { type: 'button', onclick: vergessen }, 'Passwort vergessen')));

  ziel.append(el('div', { class: 'anmeldung' },
    el('img', { src: 'icon-192.png', alt: '', class: 'anmeldung-logo' }),
    el('h1', {}, 'Englisch-Verbs'),
    form));

  async function vergessen() {
    const adresse = email.value.trim();
    if (!adresse) {
      meldung('Bitte zuerst die E-Mail-Adresse eintragen');
      return email.focus();
    }
    const fehler = await passwortVergessen(adresse);
    meldung(fehler ?? `Falls „${adresse}“ ein Konto hat, kommt gleich eine E-Mail zum Zurücksetzen.`, fehler ? 'fehler' : 'info');
  }
}
