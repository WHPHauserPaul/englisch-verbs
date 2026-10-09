import { beiSitzung, istLehrer, istAdmin, istWiederherstellung } from './cloud/auth.js';
import { zeigeAnmeldung } from './seiten/anmelden.js';
import { zeigePasswortSetzenDialog } from './seiten/passwortSetzen.js';
import { zeigeStart } from './seiten/start.js';
import { zeigeKartei } from './seiten/kartei.js';
import { zeigeLernen } from './seiten/lernen.js';
import { zeigeListen } from './seiten/listen.js';
import { zeigeListe } from './seiten/liste.js';
import { zeigeGruppen } from './seiten/gruppen.js';
import { zeigeFortschritt } from './seiten/fortschritt.js';
import { zeigeKonten } from './seiten/konten.js';
import { zeigeKonto } from './seiten/konto.js';
import { meldung } from './ui.js';

// menue: welcher Eintrag der Navigation zur Seite gehört.
const seiten = {
  start: { zeigen: zeigeStart },
  kartei: { zeigen: zeigeKartei },
  lernen: { zeigen: zeigeLernen, vollbild: true },
  listen: { zeigen: zeigeListen, menue: 'listen' },
  liste: { zeigen: zeigeListe, menue: 'listen' },
  gruppen: { zeigen: zeigeGruppen, menue: 'gruppen' },
  fortschritt: { zeigen: zeigeFortschritt, menue: 'fortschritt' },
  konten: { zeigen: zeigeKonten, menue: 'konten' },
  konto: { zeigen: zeigeKonto, menue: 'konto' },
};

// Wechselt man die Seite, während die vorige noch lädt, darf deren Ergebnis die neue nicht überschreiben.
let durchlauf = 0;

async function navigieren() {
  const nummer = ++durchlauf;
  const inhalt = document.getElementById('inhalt');
  const [name, parameter] = location.hash.replace(/^#\/?/, '').split('/');
  const seite = seiten[name] ?? seiten.start;
  document.querySelectorAll('.kopf a').forEach(a =>
    a.classList.toggle('aktiv', a.getAttribute('href') === `#/${seite.menue}`));
  document.body.classList.toggle('vollbild', !!seite.vollbild);
  const neu = document.createElement('div');
  try {
    await seite.zeigen(neu, parameter);
  } catch (fehler) {
    meldung(fehler.message);
  }
  if (nummer === durchlauf) inhalt.replaceChildren(neu);
}

let angemeldetAls;
beiSitzung(sitzung => {
  document.body.classList.toggle('lehrer', istLehrer());
  document.body.classList.toggle('admin', istAdmin());
  document.body.classList.toggle('abgemeldet', !sitzung);
  // Nur beim Wechsel des Kontos neu zeichnen, nicht bei jeder Profiländerung.
  const id = sitzung?.user.id ?? null;
  if (id === angemeldetAls) return;
  angemeldetAls = id;
  if (sitzung) navigieren();
  else {
    durchlauf++;
    const inhalt = document.getElementById('inhalt');
    inhalt.replaceChildren();
    zeigeAnmeldung(inhalt);
  }
});

window.addEventListener('hashchange', () => {
  // Ein offenes Fenster gehört zur vorigen Seite (z. B. Zurück-Taste am Handy).
  document.querySelectorAll('dialog[open]').forEach(d => d.schliessen ? d.schliessen(false) : d.close());
  if (angemeldetAls) navigieren();
});

if (istWiederherstellung()) {
  // Die Adresszeile zeigt sonst dauerhaft die Zugangsdaten aus dem E-Mail-Link.
  history.replaceState(null, '', location.pathname + location.search);
  zeigePasswortSetzenDialog();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
