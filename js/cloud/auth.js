// Anmeldung und Sitzung (LH 2.1). Die Passwortprüfung liegt komplett bei Supabase, hier wird nur
// die Sitzung verfolgt und das Profil mit der Rolle (LH 2.3) dazu geladen.
import { supabase } from './supabaseClient.js';

const beobachter = new Set();
let sitzung = null; // { user, profil: { name, rolle } } oder null
let bereit = false;

// Sofort beim Laden aus der Adresse lesen, ob der Link aus der Einladungs- oder Passwort-vergessen-
// E-Mail geöffnet wurde: auf das Ereignis von Supabase ist kein Verlass, es kann zu früh feuern.
const wiederherstellung = location.hash.includes('type=recovery') || location.hash.includes('type=invite');

// Adresse der App ohne Seitenteil: dorthin führt der Link in der E-Mail zurück.
export const appAdresse = location.origin + location.pathname;

async function profilLaden(id) {
  const { data } = await supabase.from('profile').select('name, rolle').eq('id', id).maybeSingle();
  return data ?? { name: '', rolle: 'schueler' };
}

async function sitzungSetzen(s) {
  sitzung = s ? { user: s.user, profil: await profilLaden(s.user.id) } : null;
  bereit = true;
  beobachter.forEach(fn => fn(sitzung));
}

const { data } = await supabase.auth.getSession();
await sitzungSetzen(data.session);
supabase.auth.onAuthStateChange((ereignis, s) => {
  // INITIAL_SESSION ist der Stand, den getSession() oben schon geliefert hat. Nur Wechsel
  // des Kontos zählen: ein erneuertes Zugangs-Token soll die Seite nicht neu zeichnen.
  if (ereignis === 'INITIAL_SESSION' || ereignis === 'TOKEN_REFRESHED') return;
  if ((s?.user.id ?? null) === (sitzung?.user.id ?? null) && ereignis !== 'USER_UPDATED') return;
  // Erst nach dem Rückruf weitermachen: eine Datenbankabfrage direkt darin wartet auf die
  // Sperre, die Supabase während des Rückrufs selbst hält, und bliebe hängen.
  setTimeout(() => sitzungSetzen(s));
});

export const istWiederherstellung = () => wiederherstellung;
export const aktuelleSitzung = () => sitzung;
export const meineId = () => sitzung?.user.id;
export const istLehrer = () => ['lehrer', 'admin'].includes(sitzung?.profil.rolle);
export const istAdmin = () => sitzung?.profil.rolle === 'admin';

export function beiSitzung(fn) {
  beobachter.add(fn);
  if (bereit) fn(sitzung);
  return () => beobachter.delete(fn);
}

// Fehler kommen als deutsche Meldung zurück statt als Ausnahme: ein falsches Passwort ist ein
// normaler Fall, kein Programmfehler.
export async function anmelden(email, passwort) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
  if (!error) return null;
  if (error.message.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.';
  return `Anmeldung fehlgeschlagen: ${error.message}`;
}

export async function abmelden() {
  await supabase.auth.signOut();
}

export async function passwortVergessen(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appAdresse });
  return error ? `Fehlgeschlagen: ${error.message}` : null;
}

export async function passwortSetzen(neu) {
  const { error } = await supabase.auth.updateUser({ password: neu });
  return error ? `Passwort konnte nicht gesetzt werden: ${error.message}` : null;
}

// Nach einer Namensänderung unter "Konto" soll die Kopfzeile den neuen Namen zeigen.
export async function profilNeuLaden() {
  if (!sitzung) return;
  sitzung.profil = await profilLaden(sitzung.user.id);
  beobachter.forEach(fn => fn(sitzung));
}
