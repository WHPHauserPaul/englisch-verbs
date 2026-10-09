// Alle Datenbankzugriffe an einer Stelle. Was jemand sehen und ändern darf, entscheiden die
// Zugriffsregeln in supabase/schema.sql, nicht dieser Code.
import { supabase, pruefen } from './supabaseClient.js';
import { meineId } from './auth.js';

// Supabase liefert höchstens 1000 Zeilen pro Abfrage; eine Lehreransicht über eine ganze Klasse
// hat schnell mehr Lernstände. abfrage() muss bei jedem Aufruf eine neue Abfrage bauen.
async function alleZeilen(abfrage) {
  const zeilen = [];
  for (let von = 0; ; von += 1000) {
    const teil = pruefen(await abfrage().range(von, von + 999));
    zeilen.push(...teil);
    if (teil.length < 1000) return zeilen;
  }
}

// --- Listen und Einträge (LH 3) ---

export const meineListen = async () => pruefen(await supabase.rpc('meine_listen'));
export const alleListen = async () => pruefen(await supabase.from('liste').select('*, eintrag(count)').order('name'));
export const liste = async id => pruefen(await supabase.from('liste').select('*').eq('id', id).single());

export const listeAnlegen = async (name, art) =>
  pruefen(await supabase.from('liste').insert({ name, art }).select().single());
export const listeUmbenennen = async (id, name) =>
  pruefen(await supabase.from('liste').update({ name }).eq('id', id));
export const listeLoeschen = async id => pruefen(await supabase.from('liste').delete().eq('id', id));

export const eintraege = listeId => alleZeilen(() =>
  supabase.from('eintrag').select('*').eq('liste_id', listeId).order('position').order('erstellt_am'));

export async function eintragSpeichern(eintrag) {
  const { id, ...felder } = eintrag;
  if (id) return pruefen(await supabase.from('eintrag').update(felder).eq('id', id));
  return pruefen(await supabase.from('eintrag').insert(felder));
}
export const eintragLoeschen = async id => pruefen(await supabase.from('eintrag').delete().eq('id', id));
export const eintraegeAnfuegen = async zeilen => pruefen(await supabase.from('eintrag').insert(zeilen));

// --- Lernstand (LH 6) ---

// Stände eines Schülers (Standard: man selbst) für eine Liste.
export const staende = (listeId, schuelerId = meineId()) => alleZeilen(() =>
  supabase.from('karte').select('eintrag_id, richtung, fach, faellig_am, anzahl_falsch, zuletzt, eintrag!inner(liste_id)')
    .eq('eintrag.liste_id', listeId).eq('schueler_id', schuelerId));

// LH 8.1: Stände mehrerer Schüler für eine Liste.
export const staendeVon = (listeId, schuelerIds) => alleZeilen(() =>
  supabase.from('karte').select('schueler_id, eintrag_id, richtung, fach, faellig_am, anzahl_falsch, zuletzt, eintrag!inner(liste_id)')
    .eq('eintrag.liste_id', listeId).in('schueler_id', schuelerIds));

export async function standSpeichern(stand) {
  pruefen(await supabase.from('karte')
    .upsert({ ...stand, schueler_id: meineId() }, { onConflict: 'schueler_id,eintrag_id,richtung' }));
}

// LH 5.3 / 8.3: Fortschritt einer Liste zurücksetzen.
export async function fortschrittLoeschen(listeId, schuelerId = meineId()) {
  const ids = (await eintraege(listeId)).map(e => e.id);
  for (let i = 0; i < ids.length; i += 200) {
    pruefen(await supabase.from('karte').delete().eq('schueler_id', schuelerId).in('eintrag_id', ids.slice(i, i + 200)));
  }
}

// --- Konten (LH 2) ---

export const alleProfile = async () => pruefen(await supabase.from('profile').select('id, name, email, rolle').order('name'));
export const nameAendern = async name => pruefen(await supabase.from('profile').update({ name }).eq('id', meineId()));
export const rolleSetzen = async (konto, rolle) => pruefen(await supabase.rpc('rolle_setzen', { konto, neue_rolle: rolle }));

export async function kontoAnlegen(email, name, rolle, ziel) {
  const { data, error } = await supabase.functions.invoke('konto-anlegen', { body: { email, name, rolle, ziel } });
  if (error) {
    // Bei einem Fehlerstatus steht der eigentliche Grund nur im Antworttext der Funktion.
    const koerper = await error.context?.json?.().catch(() => null);
    throw new Error(koerper?.error ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
}

// --- Gruppen und Zuordnung (LH 4) ---

export const gruppen = async () => pruefen(await supabase.from('gruppe').select('*').order('name'));
export const gruppeAnlegen = async name => pruefen(await supabase.from('gruppe').insert({ name }).select().single());
export const gruppeUmbenennen = async (id, name) => pruefen(await supabase.from('gruppe').update({ name }).eq('id', id));
export const gruppeLoeschen = async id => pruefen(await supabase.from('gruppe').delete().eq('id', id));

export const mitglieder = async gruppeId =>
  (pruefen(await supabase.from('gruppe_mitglied').select('schueler_id').eq('gruppe_id', gruppeId))).map(m => m.schueler_id);
export const mitgliedHinzu = async (gruppeId, schuelerId) =>
  pruefen(await supabase.from('gruppe_mitglied').insert({ gruppe_id: gruppeId, schueler_id: schuelerId }));
export const mitgliedEntfernen = async (gruppeId, schuelerId) =>
  pruefen(await supabase.from('gruppe_mitglied').delete().eq('gruppe_id', gruppeId).eq('schueler_id', schuelerId));

export const zuordnungen = async listeId =>
  pruefen(await supabase.from('zuordnung').select('id, gruppe_id, schueler_id').eq('liste_id', listeId));
export const zuordnen = async (listeId, ziel) =>
  pruefen(await supabase.from('zuordnung').insert({ liste_id: listeId, ...ziel }));
export const zuordnungEntfernen = async id => pruefen(await supabase.from('zuordnung').delete().eq('id', id));
